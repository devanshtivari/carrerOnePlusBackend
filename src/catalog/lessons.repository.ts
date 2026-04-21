import { Injectable } from '@nestjs/common';
import { Lesson, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LessonsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.LessonCreateInput): Promise<Lesson> {
    return this.prisma.lesson.create({ data });
  }

  async findById(id: string): Promise<Lesson | null> {
    return this.prisma.lesson.findUnique({ where: { id } });
  }

  async findByChapterAndPosition(chapterId: string, position: number): Promise<Lesson | null> {
    return this.prisma.lesson.findUnique({
      where: { chapterId_position: { chapterId, position } },
    });
  }

  async findAllByChapter(chapterId: string): Promise<Lesson[]> {
    return this.prisma.lesson.findMany({
      where: { chapterId },
      orderBy: { position: 'asc' },
    });
  }

  async update(id: string, data: Prisma.LessonUpdateInput): Promise<Lesson> {
    return this.prisma.lesson.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Lesson> {
    return this.prisma.lesson.delete({ where: { id } });
  }
}
