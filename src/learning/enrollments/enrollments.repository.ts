import { Injectable } from '@nestjs/common';
import { Enrollment, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

const enrollmentSelect = {
  id: true,
  userId: true,
  courseId: true,
  progress: true,
  enrolledAt: true,
  completedAt: true,
  lastAccessAt: true,
  createdAt: true,
  updatedAt: true,
  course: {
    select: {
      id: true,
      slug: true,
      title: true,
      shortName: true,
      description: true,
      imageUrl: true,
      level: true,
      durationLabel: true,
      ratingAvg: true,
      ratingCount: true,
      totalLessons: true,
      totalUnits: true,
    },
  },
} satisfies Prisma.EnrollmentSelect;

export type EnrollmentDetail = Prisma.EnrollmentGetPayload<{
  select: typeof enrollmentSelect;
}>;

export interface FindAllEnrollmentsArgs {
  skip: number;
  take: number;
  where: Prisma.EnrollmentWhereInput;
  orderBy: Prisma.EnrollmentOrderByWithRelationInput;
}

@Injectable()
export class EnrollmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  readonly defaultSelect = enrollmentSelect;

  async create(data: Prisma.EnrollmentCreateInput): Promise<Enrollment> {
    return this.prisma.enrollment.create({ data });
  }

  async findAll({
    skip,
    take,
    where,
    orderBy,
  }: FindAllEnrollmentsArgs): Promise<{ items: EnrollmentDetail[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where,
        orderBy,
        skip,
        take,
        select: enrollmentSelect,
      }),
      this.prisma.enrollment.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<EnrollmentDetail | null> {
    return this.prisma.enrollment.findUnique({ where: { id }, select: enrollmentSelect });
  }

  async findByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<EnrollmentDetail | null> {
    return this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: enrollmentSelect,
    });
  }

  async update(id: string, data: Prisma.EnrollmentUpdateInput): Promise<Enrollment> {
    return this.prisma.enrollment.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Enrollment> {
    return this.prisma.enrollment.delete({ where: { id } });
  }
}
