import { Injectable } from '@nestjs/common';
import { Prisma, Unit } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UnitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UnitCreateInput): Promise<Unit> {
    return this.prisma.unit.create({ data });
  }

  async findById(id: string): Promise<Unit | null> {
    return this.prisma.unit.findUnique({ where: { id } });
  }

  async findByCourseAndModule(courseId: string, moduleNumber: number): Promise<Unit | null> {
    return this.prisma.unit.findUnique({
      where: { courseId_moduleNumber: { courseId, moduleNumber } },
    });
  }

  async findAllByCourse(courseId: string): Promise<Unit[]> {
    return this.prisma.unit.findMany({
      where: { courseId },
      orderBy: [{ position: 'asc' }, { moduleNumber: 'asc' }],
    });
  }

  async update(id: string, data: Prisma.UnitUpdateInput): Promise<Unit> {
    return this.prisma.unit.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Unit> {
    return this.prisma.unit.delete({ where: { id } });
  }
}
