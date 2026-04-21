import { Injectable } from '@nestjs/common';
import { Course, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

const courseSelect = {
  id: true,
  slug: true,
  title: true,
  shortName: true,
  description: true,
  imageUrl: true,
  level: true,
  badge: true,
  priceCents: true,
  originalPriceCents: true,
  currency: true,
  durationLabel: true,
  ratingAvg: true,
  ratingCount: true,
  enrolledLabel: true,
  isFeatured: true,
  isPublished: true,
  classmateCount: true,
  learnings: true,
  tags: true,
  totalLessons: true,
  totalUnits: true,
  totalTopics: true,
  totalTests: true,
  totalProjects: true,
  categoryId: true,
  instructorId: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, slug: true, label: true } },
  instructor: {
    select: { id: true, fullName: true, instructorTitle: true, avatarUrl: true, initials: true },
  },
} satisfies Prisma.CourseSelect;

export type CourseListItem = Prisma.CourseGetPayload<{ select: typeof courseSelect }>;

export interface FindAllCoursesArgs {
  skip: number;
  take: number;
  where: Prisma.CourseWhereInput;
  orderBy: Prisma.CourseOrderByWithRelationInput;
}

@Injectable()
export class CoursesRepository {
  constructor(private readonly prisma: PrismaService) {}

  readonly defaultSelect = courseSelect;

  async create(data: Prisma.CourseCreateInput): Promise<Course> {
    return this.prisma.course.create({ data });
  }

  async findAll({
    skip,
    take,
    where,
    orderBy,
  }: FindAllCoursesArgs): Promise<{ items: CourseListItem[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        orderBy,
        skip,
        take,
        select: courseSelect,
      }),
      this.prisma.course.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<CourseListItem | null> {
    return this.prisma.course.findUnique({ where: { id }, select: courseSelect });
  }

  async findBySlug(slug: string): Promise<CourseListItem | null> {
    return this.prisma.course.findUnique({ where: { slug }, select: courseSelect });
  }

  async update(id: string, data: Prisma.CourseUpdateInput): Promise<Course> {
    return this.prisma.course.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Course> {
    return this.prisma.course.delete({ where: { id } });
  }
}
