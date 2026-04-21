import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { EnrollmentsRepository } from '../enrollments/enrollments.repository';
import { LessonCompletionsRepository } from './lesson-completions.repository';

interface ActorContext {
  id: string;
  role: UserRole;
}

export interface CourseProgressSummary {
  courseId: string;
  enrollmentId: string | null;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  completedAt: Date | null;
  completedLessonIds: string[];
}

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly completionsRepo: LessonCompletionsRepository,
    private readonly enrollmentsRepo: EnrollmentsRepository,
  ) {}

  async markLessonComplete(
    lessonId: string,
    actor: ActorContext,
  ): Promise<CourseProgressSummary> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        chapter: {
          select: {
            id: true,
            unit: { select: { id: true, courseId: true } },
          },
        },
      },
    });
    if (!lesson) throw new NotFoundException(`Lesson ${lessonId} not found`);

    const courseId = lesson.chapter.unit.courseId;

    const enrollment = await this.enrollmentsRepo.findByUserAndCourse(actor.id, courseId);
    if (!enrollment && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You must be enrolled in the course first');
    }

    const existing = await this.completionsRepo.findByUserAndLesson(actor.id, lessonId);
    if (!existing) {
      await this.completionsRepo.create({
        user: { connect: { id: actor.id } },
        lesson: { connect: { id: lessonId } },
      });
    }

    return this.recalcCourseProgress(actor.id, courseId);
  }

  async unmarkLessonComplete(
    lessonId: string,
    actor: ActorContext,
  ): Promise<CourseProgressSummary> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, chapter: { select: { unit: { select: { courseId: true } } } } },
    });
    if (!lesson) throw new NotFoundException(`Lesson ${lessonId} not found`);

    const courseId = lesson.chapter.unit.courseId;
    const existing = await this.completionsRepo.findByUserAndLesson(actor.id, lessonId);
    if (existing) {
      await this.completionsRepo.deleteByUserAndLesson(actor.id, lessonId);
    }
    return this.recalcCourseProgress(actor.id, courseId);
  }

  async getCourseProgress(
    courseId: string,
    actor: ActorContext,
  ): Promise<CourseProgressSummary> {
    return this.recalcCourseProgress(actor.id, courseId, { persist: false });
  }

  async getCourseProgressForUser(
    userId: string,
    courseId: string,
    actor: ActorContext,
  ): Promise<CourseProgressSummary> {
    if (actor.role !== UserRole.ADMIN && actor.id !== userId) {
      throw new ForbiddenException('You can only view your own progress');
    }
    return this.recalcCourseProgress(userId, courseId, { persist: false });
  }

  private async recalcCourseProgress(
    userId: string,
    courseId: string,
    opts: { persist?: boolean } = {},
  ): Promise<CourseProgressSummary> {
    const persist = opts.persist ?? true;

    const [course, completions, enrollment] = await Promise.all([
      this.prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, totalLessons: true },
      }),
      this.completionsRepo.listByUserAndCourse(userId, courseId),
      this.enrollmentsRepo.findByUserAndCourse(userId, courseId),
    ]);

    if (!course) throw new NotFoundException(`Course ${courseId} not found`);

    const totalLessons = course.totalLessons ?? (await this.countCourseLessons(courseId));
    const completedLessons = completions.length;
    const progressPercent =
      totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;

    let completedAt: Date | null = enrollment?.completedAt ?? null;

    if (enrollment && persist) {
      const isComplete = totalLessons > 0 && completedLessons >= totalLessons;
      const update: { progress?: number; completedAt?: Date | null; lastAccessAt?: Date } = {
        progress: progressPercent,
        lastAccessAt: new Date(),
      };
      if (isComplete && !enrollment.completedAt) {
        update.completedAt = new Date();
        completedAt = update.completedAt;
      } else if (!isComplete && enrollment.completedAt) {
        update.completedAt = null;
        completedAt = null;
      }
      await this.enrollmentsRepo.update(enrollment.id, update);
    }

    return {
      courseId,
      enrollmentId: enrollment?.id ?? null,
      totalLessons,
      completedLessons,
      progressPercent,
      completedAt,
      completedLessonIds: completions.map((c) => c.lessonId),
    };
  }

  private async countCourseLessons(courseId: string): Promise<number> {
    return this.prisma.lesson.count({
      where: { chapter: { unit: { courseId } } },
    });
  }
}
