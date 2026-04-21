import { Prisma } from '@prisma/client';

import { assignmentsSeedData } from './data/assignments.data';
import { SeederContext } from './index';

/**
 * Seeds Assignments scoped to classes/courses. Idempotent: keyed by
 * (classCode, title) since Assignment has no natural unique constraint.
 */
export async function seedAssignments({ prisma }: SeederContext): Promise<void> {
  const classCodes = assignmentsSeedData
    .map((a) => a.classCode)
    .filter((c): c is string => !!c);
  const courseSlugs = assignmentsSeedData
    .map((a) => a.courseSlug)
    .filter((c): c is string => !!c);

  const [classes, courses] = await Promise.all([
    classCodes.length
      ? prisma.class.findMany({
          where: { code: { in: classCodes } },
          select: { id: true, code: true },
        })
      : Promise.resolve([] as { id: string; code: string }[]),
    courseSlugs.length
      ? prisma.course.findMany({
          where: { slug: { in: courseSlugs } },
          select: { id: true, slug: true },
        })
      : Promise.resolve([] as { id: string; slug: string }[]),
  ]);

  const classIdByCode = new Map(classes.map((c) => [c.code, c.id]));
  const courseIdBySlug = new Map(courses.map((c) => [c.slug, c.id]));

  for (const seed of assignmentsSeedData) {
    const classId = seed.classCode ? classIdByCode.get(seed.classCode) ?? null : null;
    const courseId = seed.courseSlug ? courseIdBySlug.get(seed.courseSlug) ?? null : null;

    const data: Prisma.AssignmentUncheckedCreateInput = {
      title: seed.title,
      description: seed.description ?? null,
      dueDate: new Date(seed.dueDate),
      status: seed.status,
      totalStudents: seed.totalStudents,
      submittedCount: seed.submittedCount,
      classId,
      courseId,
    };

    const existing = await prisma.assignment.findFirst({
      where: { title: seed.title, classId, deletedAt: null },
      select: { id: true },
    });

    if (existing) {
      await prisma.assignment.update({ where: { id: existing.id }, data });
    } else {
      await prisma.assignment.create({ data });
    }
  }
}
