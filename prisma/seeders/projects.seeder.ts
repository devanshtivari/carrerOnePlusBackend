import { Prisma } from '@prisma/client';

import { projectsSeedData } from './data/projects.data';
import { SeederContext } from './index';

/**
 * Seeds Projects (course-level deliverables). Idempotent: keyed by
 * (courseSlug, title) since Project has no natural unique constraint.
 */
export async function seedProjects({ prisma }: SeederContext): Promise<void> {
  const slugs = projectsSeedData
    .map((p) => p.courseSlug)
    .filter((s): s is string => !!s);
  const courses = slugs.length
    ? await prisma.course.findMany({
        where: { slug: { in: slugs } },
        select: { id: true, slug: true },
      })
    : [];
  const courseIdBySlug = new Map(courses.map((c) => [c.slug, c.id]));

  for (const seed of projectsSeedData) {
    const courseId = seed.courseSlug ? courseIdBySlug.get(seed.courseSlug) : null;

    const data: Prisma.ProjectUncheckedCreateInput = {
      title: seed.title,
      description: seed.description,
      imageUrl: seed.imageUrl,
      deadline: new Date(seed.deadline),
      totalMarks: seed.totalMarks,
      isActive: seed.isActive,
      courseId: courseId ?? null,
    };

    const existing = await prisma.project.findFirst({
      where: { title: seed.title, courseId: courseId ?? null, deletedAt: null },
      select: { id: true },
    });

    if (existing) {
      await prisma.project.update({ where: { id: existing.id }, data });
    } else {
      await prisma.project.create({ data });
    }
  }
}
