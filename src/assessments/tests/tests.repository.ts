import { Injectable } from '@nestjs/common';
import { Prisma, Test } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

const testListSelect = {
  id: true,
  code: true,
  title: true,
  description: true,
  courseLabel: true,
  courseId: true,
  durationMinutes: true,
  totalMarks: true,
  totalQuestions: true,
  type: true,
  status: true,
  scheduledAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TestSelect;

const testDetailSelect = {
  ...testListSelect,
  course: { select: { id: true, slug: true, title: true } },
} satisfies Prisma.TestSelect;

export type TestListItem = Prisma.TestGetPayload<{ select: typeof testListSelect }>;
export type TestDetail = Prisma.TestGetPayload<{ select: typeof testDetailSelect }>;

export interface FindAllTestsArgs {
  skip: number;
  take: number;
  where: Prisma.TestWhereInput;
  orderBy: Prisma.TestOrderByWithRelationInput;
}

@Injectable()
export class TestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  readonly defaultSelect = testListSelect;
  readonly detailSelect = testDetailSelect;

  async create(data: Prisma.TestCreateInput): Promise<Test> {
    return this.prisma.test.create({ data });
  }

  async findAll({
    skip,
    take,
    where,
    orderBy,
  }: FindAllTestsArgs): Promise<{ items: TestListItem[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.test.findMany({ where, orderBy, skip, take, select: testListSelect }),
      this.prisma.test.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<TestDetail | null> {
    return this.prisma.test.findUnique({ where: { id }, select: testDetailSelect });
  }

  async findByCode(code: string): Promise<TestDetail | null> {
    return this.prisma.test.findUnique({ where: { code }, select: testDetailSelect });
  }

  async update(id: string, data: Prisma.TestUpdateInput): Promise<Test> {
    return this.prisma.test.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Test> {
    return this.prisma.test.delete({ where: { id } });
  }

  async refreshTotals(testId: string): Promise<void> {
    const agg = await this.prisma.question.aggregate({
      where: { testId, deletedAt: null },
      _count: { _all: true },
      _sum: { marks: true },
    });
    await this.prisma.test.update({
      where: { id: testId },
      data: {
        totalQuestions: agg._count._all,
        totalMarks: agg._sum.marks ?? 0,
      },
    });
  }
}
