import { Injectable } from '@nestjs/common';
import { Prisma, Project, ProjectSubmission } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

const projectSelect = {
  id: true,
  unitId: true,
  courseId: true,
  title: true,
  description: true,
  imageUrl: true,
  deadline: true,
  totalMarks: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  unit: { select: { id: true, title: true, moduleNumber: true } },
  course: { select: { id: true, slug: true, title: true } },
} satisfies Prisma.ProjectSelect;

const submissionSelect = {
  id: true,
  projectId: true,
  userId: true,
  status: true,
  fileName: true,
  fileSize: true,
  fileUrl: true,
  submittedAt: true,
  gradedAt: true,
  marksAwarded: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSubmissionSelect;

export type ProjectListItem = Prisma.ProjectGetPayload<{ select: typeof projectSelect }>;
export type ProjectSubmissionItem = Prisma.ProjectSubmissionGetPayload<{
  select: typeof submissionSelect;
}>;

export interface FindAllProjectsArgs {
  skip: number;
  take: number;
  where: Prisma.ProjectWhereInput;
  orderBy: Prisma.ProjectOrderByWithRelationInput;
}

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  readonly defaultSelect = projectSelect;
  readonly submissionSelect = submissionSelect;

  async create(data: Prisma.ProjectCreateInput): Promise<Project> {
    return this.prisma.project.create({ data });
  }

  async findAll({
    skip,
    take,
    where,
    orderBy,
  }: FindAllProjectsArgs): Promise<{ items: ProjectListItem[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.project.findMany({ where, orderBy, skip, take, select: projectSelect }),
      this.prisma.project.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<ProjectListItem | null> {
    return this.prisma.project.findUnique({ where: { id }, select: projectSelect });
  }

  async findByUnit(unitId: string): Promise<ProjectListItem[]> {
    return this.prisma.project.findMany({
      where: { unitId },
      orderBy: { createdAt: 'asc' },
      select: projectSelect,
    });
  }

  async findByCourse(courseId: string): Promise<ProjectListItem[]> {
    return this.prisma.project.findMany({
      where: { courseId },
      orderBy: { createdAt: 'asc' },
      select: projectSelect,
    });
  }

  async update(id: string, data: Prisma.ProjectUpdateInput): Promise<Project> {
    return this.prisma.project.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Project> {
    return this.prisma.project.delete({ where: { id } });
  }

  async findSubmission(
    projectId: string,
    userId: string,
  ): Promise<ProjectSubmissionItem | null> {
    return this.prisma.projectSubmission.findFirst({
      where: { projectId, userId, deletedAt: null },
      select: submissionSelect,
    });
  }

  async findSubmissionById(id: string): Promise<ProjectSubmissionItem | null> {
    return this.prisma.projectSubmission.findUnique({
      where: { id },
      select: submissionSelect,
    });
  }

  async listSubmissions(projectId: string): Promise<ProjectSubmissionItem[]> {
    return this.prisma.projectSubmission.findMany({
      where: { projectId },
      orderBy: { submittedAt: 'desc' },
      select: submissionSelect,
    });
  }

  async listSubmissionsForUser(userId: string): Promise<ProjectSubmissionItem[]> {
    return this.prisma.projectSubmission.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
      select: submissionSelect,
    });
  }

  async upsertSubmission(
    projectId: string,
    userId: string,
    data: {
      status: ProjectSubmission['status'];
      fileName?: string | null;
      fileSize?: string | null;
      fileUrl?: string | null;
      submittedAt?: Date | null;
    },
  ): Promise<ProjectSubmission> {
    return this.prisma.projectSubmission.upsert({
      where: { projectId_userId: { projectId, userId } },
      create: {
        projectId,
        userId,
        status: data.status,
        fileName: data.fileName ?? null,
        fileSize: data.fileSize ?? null,
        fileUrl: data.fileUrl ?? null,
        submittedAt: data.submittedAt ?? null,
      },
      update: {
        status: data.status,
        fileName: data.fileName ?? null,
        fileSize: data.fileSize ?? null,
        fileUrl: data.fileUrl ?? null,
        submittedAt: data.submittedAt ?? null,
      },
    });
  }

  async updateSubmission(
    id: string,
    data: Prisma.ProjectSubmissionUpdateInput,
  ): Promise<ProjectSubmission> {
    return this.prisma.projectSubmission.update({ where: { id }, data });
  }

  async softDeleteSubmission(id: string): Promise<ProjectSubmission> {
    return this.prisma.projectSubmission.delete({ where: { id } });
  }
}
