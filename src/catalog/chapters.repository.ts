import { Injectable } from '@nestjs/common';
import { Chapter, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChaptersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ChapterCreateInput): Promise<Chapter> {
    return this.prisma.chapter.create({ data });
  }

  async findById(id: string): Promise<Chapter | null> {
    return this.prisma.chapter.findUnique({ where: { id } });
  }

  async findByUnitAndPosition(unitId: string, position: number): Promise<Chapter | null> {
    return this.prisma.chapter.findUnique({
      where: { unitId_position: { unitId, position } },
    });
  }

  async findAllByUnit(unitId: string): Promise<Chapter[]> {
    return this.prisma.chapter.findMany({
      where: { unitId },
      orderBy: { position: 'asc' },
    });
  }

  async update(id: string, data: Prisma.ChapterUpdateInput): Promise<Chapter> {
    return this.prisma.chapter.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Chapter> {
    return this.prisma.chapter.delete({ where: { id } });
  }
}
