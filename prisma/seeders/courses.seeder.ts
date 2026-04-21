import { Prisma } from '@prisma/client';

import {
  coursesSeedData,
  courseGradeAssignments,
  CourseSeed,
  GRADE_TAG_PREFIX,
  UnitSeed,
} from './data/courses.data';
import { SeederContext } from './index';

/**
 * Merge the hand-authored `tags` list with the grade-level tags defined in
 * `courseGradeAssignments`. Duplicates are removed so the column stays clean.
 */
function buildTagList(course: CourseSeed): string[] {
  const base = course.tags ?? [];
  const grades = course.gradeLevels ?? courseGradeAssignments[course.slug] ?? [];
  const gradeTags = grades.map((g) => `${GRADE_TAG_PREFIX}${g}`);
  return Array.from(new Set([...base, ...gradeTags]));
}

/**
 * Seeds the Course → Unit → Chapter → Lesson → Resource hierarchy.
 *
 * Idempotent: every entity is upserted by its natural unique key
 *   - Course: slug
 *   - Unit:   (courseId, moduleNumber)
 *   - Chapter:(unitId, position)
 *   - Lesson: (chapterId, position)
 *   - Resource: name within unit (no DB-level unique, so we wipe+rewrite per unit)
 */
export async function seedCourses({ prisma }: SeederContext): Promise<void> {
  const categoryMap = await loadCategoryMap(prisma);
  const instructorMap = await loadInstructorMap(prisma);

  for (const course of coursesSeedData) {
    const courseId = await upsertCourse(prisma, course, categoryMap, instructorMap);
    if (course.units?.length) {
      for (const unit of course.units) {
        await upsertUnit(prisma, courseId, unit);
      }
    }
  }
}

async function loadCategoryMap(prisma: SeederContext['prisma']): Promise<Map<string, string>> {
  const rows = await prisma.category.findMany({ select: { id: true, slug: true } });
  return new Map(rows.map((r) => [r.slug, r.id]));
}

async function loadInstructorMap(prisma: SeederContext['prisma']): Promise<Map<string, string>> {
  const rows = await prisma.user.findMany({
    where: { role: 'INSTRUCTOR' },
    select: { id: true, email: true },
  });
  return new Map(rows.map((r) => [r.email, r.id]));
}

async function upsertCourse(
  prisma: SeederContext['prisma'],
  course: CourseSeed,
  categoryMap: Map<string, string>,
  instructorMap: Map<string, string>,
): Promise<string> {
  const categoryId = course.categorySlug ? categoryMap.get(course.categorySlug) : undefined;
  const instructorId = course.instructorEmail ? instructorMap.get(course.instructorEmail) : undefined;

  const writable: Prisma.CourseUpdateInput = {
    title: course.title,
    shortName: course.shortName ?? null,
    description: course.description,
    imageUrl: course.imageUrl ?? null,
    level: course.level,
    badge: course.badge ?? null,
    priceCents: course.priceCents ?? null,
    originalPriceCents: course.originalPriceCents ?? null,
    currency: course.currency ?? 'INR',
    durationLabel: course.durationLabel ?? null,
    ratingAvg: course.ratingAvg ?? 0,
    ratingCount: course.ratingCount ?? 0,
    enrolledLabel: course.enrolledLabel ?? null,
    isFeatured: course.isFeatured ?? false,
    isPublished: course.isPublished ?? true,
    classmateCount: course.classmateCount ?? 0,
    learnings: course.learnings ?? [],
    tags: buildTagList(course),
    totalLessons: course.totalLessons ?? 0,
    totalUnits: course.totalUnits ?? course.units?.length ?? 0,
    totalTopics: course.totalTopics ?? 0,
    totalTests: course.totalTests ?? 0,
    totalProjects: course.totalProjects ?? 0,
    deletedAt: null,
    ...(categoryId
      ? { category: { connect: { id: categoryId } } }
      : { category: { disconnect: true } }),
    ...(instructorId
      ? { instructor: { connect: { id: instructorId } } }
      : { instructor: { disconnect: true } }),
  };

  const created = await prisma.course.upsert({
    where: { slug: course.slug },
    update: writable,
    create: {
      slug: course.slug,
      title: course.title,
      shortName: course.shortName,
      description: course.description,
      imageUrl: course.imageUrl,
      level: course.level,
      badge: course.badge,
      priceCents: course.priceCents,
      originalPriceCents: course.originalPriceCents,
      currency: course.currency ?? 'INR',
      durationLabel: course.durationLabel,
      ratingAvg: course.ratingAvg ?? 0,
      ratingCount: course.ratingCount ?? 0,
      enrolledLabel: course.enrolledLabel,
      isFeatured: course.isFeatured ?? false,
      isPublished: course.isPublished ?? true,
      classmateCount: course.classmateCount ?? 0,
      learnings: course.learnings ?? [],
      tags: buildTagList(course),
      totalLessons: course.totalLessons ?? 0,
      totalUnits: course.totalUnits ?? course.units?.length ?? 0,
      totalTopics: course.totalTopics ?? 0,
      totalTests: course.totalTests ?? 0,
      totalProjects: course.totalProjects ?? 0,
      ...(categoryId && { category: { connect: { id: categoryId } } }),
      ...(instructorId && { instructor: { connect: { id: instructorId } } }),
    },
    select: { id: true },
  });

  return created.id;
}

async function upsertUnit(
  prisma: SeederContext['prisma'],
  courseId: string,
  unit: UnitSeed,
): Promise<void> {
  const unitRow = await prisma.unit.upsert({
    where: { courseId_moduleNumber: { courseId, moduleNumber: unit.moduleNumber } },
    update: {
      title: unit.title,
      description: unit.description ?? null,
      imageUrl: unit.imageUrl ?? null,
      durationLabel: unit.durationLabel ?? null,
      status: unit.status,
      isLocked: unit.isLocked ?? false,
      position: unit.moduleNumber,
      deletedAt: null,
    },
    create: {
      courseId,
      moduleNumber: unit.moduleNumber,
      title: unit.title,
      description: unit.description,
      imageUrl: unit.imageUrl,
      durationLabel: unit.durationLabel,
      status: unit.status,
      isLocked: unit.isLocked ?? false,
      position: unit.moduleNumber,
    },
    select: { id: true },
  });

  if (unit.chapters?.length) {
    for (const chapter of unit.chapters) {
      const chapterRow = await prisma.chapter.upsert({
        where: { unitId_position: { unitId: unitRow.id, position: chapter.position } },
        update: {
          title: chapter.title,
          description: chapter.description ?? null,
          durationLabel: chapter.durationLabel ?? null,
          totalLessons: chapter.lessons.length,
          deletedAt: null,
        },
        create: {
          unitId: unitRow.id,
          position: chapter.position,
          title: chapter.title,
          description: chapter.description,
          durationLabel: chapter.durationLabel,
          totalLessons: chapter.lessons.length,
        },
        select: { id: true },
      });

      for (const lesson of chapter.lessons) {
        await prisma.lesson.upsert({
          where: {
            chapterId_position: { chapterId: chapterRow.id, position: lesson.position },
          },
          update: {
            title: lesson.title,
            type: lesson.type,
            durationLabel: lesson.durationLabel,
            deletedAt: null,
          },
          create: {
            chapterId: chapterRow.id,
            position: lesson.position,
            title: lesson.title,
            type: lesson.type,
            durationLabel: lesson.durationLabel,
          },
        });
      }
    }
  }

  if (unit.resources?.length) {
    // Resources have no natural unique key beyond (unit, name); we use a
    // delete-then-recreate pattern to keep the seed strictly idempotent.
    await prisma.resource.deleteMany({ where: { unitId: unitRow.id } });
    for (const [idx, resource] of unit.resources.entries()) {
      await prisma.resource.create({
        data: {
          unitId: unitRow.id,
          name: resource.name,
          kind: resource.kind,
          url: resource.url,
          sizeLabel: resource.sizeLabel,
          position: idx,
        },
      });
    }
  }
}
