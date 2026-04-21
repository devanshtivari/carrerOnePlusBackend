import { Injectable } from '@nestjs/common';
import { Assignment, AssignmentSubmission, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

const assignmentSelect = {
  id: true,
  classId: true,
  courseId: true,
  title: true,
  description: true,
  dueDate: true,
  status: true,
  totalStudents: true,
  submittedCount: true,
  createdAt: true,
  updatedAt: true,
  class: { select: { id: true, code: true, name: true } },
  course: { select: { id: true, slug: true, title: true } },
} satisfies Prisma.AssignmentSelect;

const assignmentSubmissionSelect = {
  id: true,
  assignmentId: true,
  userId: true,
  status: true,
  submittedAt: true,
  gradeLabel: true,
  marksAwarded: true,
  totalMarks: true,
  feedback: true,
  fileUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AssignmentSubmissionSelect;

export type AssignmentListItem = Prisma.AssignmentGetPayload<{
  select: typeof assignmentSelect;
}>;
export type AssignmentSubmissionItem = Prisma.AssignmentSubmissionGetPayload<{
  select: typeof assignmentSubmissionSelect;
}>;

export interface FindAllAssignmentsArgs {
  skip: number;
  take: number;
  where: Prisma.AssignmentWhereInput;
  orderBy: Prisma.AssignmentOrderByWithRelationInput;
}

@Injectable()
export class AssignmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  readonly defaultSelect = assignmentSelect;
  readonly submissionSelect = assignmentSubmissionSelect;

  async create(data: Prisma.AssignmentCreateInput): Promise<Assignment> {
    return this.prisma.assignment.create({ data });
  }

  async findAll({
    skip,
    take,
    where,
    orderBy,
  }: FindAllAssignmentsArgs): Promise<{ items: AssignmentListItem[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.assignment.findMany({
        where,
        orderBy,
        skip,
        take,
        select: assignmentSelect,
      }),
      this.prisma.assignment.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<AssignmentListItem | null> {
    return this.prisma.assignment.findUnique({ where: { id }, select: assignmentSelect });
  }

  async findByClass(classId: string): Promise<AssignmentListItem[]> {
    return this.prisma.assignment.findMany({
      where: { classId },
      orderBy: { dueDate: 'asc' },
      select: assignmentSelect,
    });
  }

  async update(id: string, data: Prisma.AssignmentUpdateInput): Promise<Assignment> {
    return this.prisma.assignment.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Assignment> {
    return this.prisma.assignment.delete({ where: { id } });
  }

  async incrementSubmittedCount(id: string, delta: number): Promise<void> {
    await this.prisma.assignment.update({
      where: { id },
      data: { submittedCount: { increment: delta } },
    });
  }

  async findSubmission(
    assignmentId: string,
    userId: string,
  ): Promise<AssignmentSubmissionItem | null> {
    return this.prisma.assignmentSubmission.findFirst({
      where: { assignmentId, userId, deletedAt: null },
      select: assignmentSubmissionSelect,
    });
  }

  async findSubmissionById(id: string): Promise<AssignmentSubmissionItem | null> {
    return this.prisma.assignmentSubmission.findUnique({
      where: { id },
      select: assignmentSubmissionSelect,
    });
  }

  async listSubmissions(assignmentId: string): Promise<AssignmentSubmissionItem[]> {
    return this.prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      orderBy: { submittedAt: 'desc' },
      select: assignmentSubmissionSelect,
    });
  }

  async listSubmissionsForUser(userId: string): Promise<AssignmentSubmissionItem[]> {
    return this.prisma.assignmentSubmission.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
      select: assignmentSubmissionSelect,
    });
  }

  async upsertSubmission(
    assignmentId: string,
    userId: string,
    data: {
      status: AssignmentSubmission['status'];
      fileUrl?: string | null;
      submittedAt?: Date | null;
    },
  ): Promise<AssignmentSubmission> {
    return this.prisma.assignmentSubmission.upsert({
      where: { assignmentId_userId: { assignmentId, userId } },
      create: {
        assignmentId,
        userId,
        status: data.status,
        fileUrl: data.fileUrl ?? null,
        submittedAt: data.submittedAt ?? null,
      },
      update: {
        status: data.status,
        fileUrl: data.fileUrl ?? null,
        submittedAt: data.submittedAt ?? null,
      },
    });
  }

  async updateSubmission(
    id: string,
    data: Prisma.AssignmentSubmissionUpdateInput,
  ): Promise<AssignmentSubmission> {
    return this.prisma.assignmentSubmission.update({ where: { id }, data });
  }

  async softDeleteSubmission(id: string): Promise<AssignmentSubmission> {
    return this.prisma.assignmentSubmission.delete({ where: { id } });
  }
}
