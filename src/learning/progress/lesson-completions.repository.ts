import { Injectable } from '@nestjs/common';
import { LessonCompletion, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LessonCompletionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.LessonCompletionCreateInput): Promise<LessonCompletion> {
    return this.prisma.lessonCompletion.create({ data });
  }

  async findByUserAndLesson(
    userId: string,
    lessonId: string,
  ): Promise<LessonCompletion | null> {
    return this.prisma.lessonCompletion.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
  }

  async listByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<LessonCompletion[]> {
    return this.prisma.lessonCompletion.findMany({
      where: {
        userId,
        lesson: {
          chapter: {
            unit: { courseId },
          },
        },
      },
    });
  }

  async listByUserAndChapter(
    userId: string,
    chapterId: string,
  ): Promise<LessonCompletion[]> {
    return this.prisma.lessonCompletion.findMany({
      where: { userId, lesson: { chapterId } },
    });
  }

  async deleteByUserAndLesson(userId: string, lessonId: string): Promise<void> {
    await this.prisma.lessonCompletion.delete({
      where: { userId_lessonId: { userId, lessonId } },
    });
  }
}
