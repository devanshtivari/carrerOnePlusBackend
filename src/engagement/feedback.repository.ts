import { Injectable } from '@nestjs/common';
import { Feedback, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

const feedbackSelect = {
  id: true,
  studentId: true,
  instructorId: true,
  sectionLabel: true,
  body: true,
  gradeLabel: true,
  contextType: true,
  contextId: true,
  createdAt: true,
  updatedAt: true,
  student: { select: { id: true, fullName: true, initials: true, avatarUrl: true } },
  instructor: {
    select: { id: true, fullName: true, initials: true, avatarUrl: true, instructorTitle: true },
  },
} satisfies Prisma.FeedbackSelect;

export type FeedbackListItem = Prisma.FeedbackGetPayload<{ select: typeof feedbackSelect }>;

export interface FindFeedbackArgs {
  skip: number;
  take: number;
  where: Prisma.FeedbackWhereInput;
  orderBy: Prisma.FeedbackOrderByWithRelationInput;
}

@Injectable()
export class FeedbackRepository {
  constructor(private readonly prisma: PrismaService) {}

  readonly defaultSelect = feedbackSelect;

  async create(data: Prisma.FeedbackCreateInput): Promise<Feedback> {
    return this.prisma.feedback.create({ data });
  }

  async findAll({
    skip,
    take,
    where,
    orderBy,
  }: FindFeedbackArgs): Promise<{ items: FeedbackListItem[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.feedback.findMany({ where, orderBy, skip, take, select: feedbackSelect }),
      this.prisma.feedback.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<FeedbackListItem | null> {
    return this.prisma.feedback.findUnique({ where: { id }, select: feedbackSelect });
  }

  async update(id: string, data: Prisma.FeedbackUpdateInput): Promise<Feedback> {
    return this.prisma.feedback.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Feedback> {
    return this.prisma.feedback.delete({ where: { id } });
  }
}
