import { Prisma } from '@prisma/client';

import { platformGuidelines, testsSeedData } from './data/tests.data';
import { SeederContext } from './index';

/**
 * Seeds Tests, Questions, Options, and platform-wide TestGuidelines.
 * Idempotent: tests are upserted by `code`; questions are reset per test
 * (delete-then-create) to keep order/options in sync with the seed source.
 */
export async function seedTests({ prisma }: SeederContext): Promise<void> {
  // 1. Platform-wide guidelines (scope = PLATFORM, no testId).
  await prisma.testGuideline.deleteMany({ where: { testId: null, scope: 'PLATFORM' } });
  if (platformGuidelines.length) {
    await prisma.testGuideline.createMany({
      data: platformGuidelines.map((text, idx) => ({
        text,
        position: idx,
        scope: 'PLATFORM',
      })),
    });
  }

  // 2. Resolve course slug → id for each test that opted in.
  const slugs = testsSeedData
    .map((t) => t.courseSlug)
    .filter((s): s is string => !!s);
  const courses = slugs.length
    ? await prisma.course.findMany({
        where: { slug: { in: slugs } },
        select: { id: true, slug: true },
      })
    : [];
  const courseIdBySlug = new Map(courses.map((c) => [c.slug, c.id]));

  // 3. Upsert each test by `code`, reset questions, recompute totals.
  for (const seed of testsSeedData) {
    const courseId = seed.courseSlug ? courseIdBySlug.get(seed.courseSlug) : undefined;
    const totalMarks = seed.questions.reduce((sum, q) => sum + (q.marks ?? 0), 0);
    const data: Prisma.TestUncheckedCreateInput = {
      code: seed.code,
      title: seed.title,
      description: seed.description ?? null,
      courseLabel: seed.courseLabel ?? null,
      courseId: courseId ?? null,
      durationMinutes: seed.durationMinutes,
      totalMarks,
      totalQuestions: seed.questions.length,
      type: seed.type,
      status: seed.status,
      scheduledAt: seed.scheduledAt ? new Date(seed.scheduledAt) : null,
    };
    const test = await prisma.test.upsert({
      where: { code: seed.code },
      create: data,
      update: data,
    });

    // Reset questions/options for this test (cascading delete handles options).
    await prisma.question.deleteMany({ where: { testId: test.id } });

    for (const q of seed.questions) {
      await prisma.question.create({
        data: {
          testId: test.id,
          type: q.type,
          prompt: q.prompt,
          marks: q.marks,
          position: q.position,
          ...(q.options && q.options.length
            ? {
                options: {
                  create: q.options.map((o, idx) => ({
                    label: o.label,
                    text: o.text,
                    isCorrect: o.isCorrect ?? false,
                    position: idx,
                  })),
                },
              }
            : {}),
        },
      });
    }
  }
}
