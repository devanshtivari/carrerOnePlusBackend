import { SeederContext } from './index';

/**
 * Marks a student's lessons as completed proportional to their enrolment
 * progress so the frontend progress bars + chapter checkmarks show real data.
 *
 * For each enrolment:
 *  - walks the course's units/chapters/lessons in order
 *  - flags `round(progress% * totalLessons)` lessons as completed
 *
 * Idempotent: uses upsert on the (userId, lessonId) unique constraint.
 */
export async function seedLessonCompletions({ prisma }: SeederContext): Promise<void> {
  const enrollments = await prisma.enrollment.findMany({
    where: { deletedAt: null },
    select: { userId: true, courseId: true, progress: true },
  });

  for (const enrolment of enrollments) {
    const lessons = await prisma.lesson.findMany({
      where: {
        deletedAt: null,
        chapter: { unit: { courseId: enrolment.courseId, deletedAt: null }, deletedAt: null },
      },
      select: { id: true, position: true, chapter: { select: { position: true, unit: { select: { moduleNumber: true } } } } },
    });
    if (lessons.length === 0) continue;

    lessons.sort((a, b) => {
      const unitDiff = a.chapter.unit.moduleNumber - b.chapter.unit.moduleNumber;
      if (unitDiff !== 0) return unitDiff;
      const chapterDiff = a.chapter.position - b.chapter.position;
      if (chapterDiff !== 0) return chapterDiff;
      return a.position - b.position;
    });

    const completedCount = Math.round((enrolment.progress / 100) * lessons.length);
    const slice = lessons.slice(0, completedCount);

    for (const lesson of slice) {
      await prisma.lessonCompletion.upsert({
        where: { userId_lessonId: { userId: enrolment.userId, lessonId: lesson.id } },
        update: {},
        create: { userId: enrolment.userId, lessonId: lesson.id },
      });
    }
  }
}
