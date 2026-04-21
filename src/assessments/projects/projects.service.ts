import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Project, SubmissionStatus, UserRole } from '@prisma/client';

import {
  PaginatedResult,
  buildPaginatedResult,
} from '../../catalog/dto/pagination.dto';
import { CreateProjectDto } from '../dto/create-project.dto';
import { ListProjectsDto } from '../dto/list-projects.dto';
import {
  CreateProjectSubmissionDto,
  GradeProjectSubmissionDto,
} from '../dto/project-submission.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import {
  ProjectListItem,
  ProjectSubmissionItem,
  ProjectsRepository,
} from './projects.repository';

interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class ProjectsService {
  constructor(private readonly repo: ProjectsRepository) {}

  async list(query: ListProjectsDto): Promise<PaginatedResult<ProjectListItem>> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.ProjectWhereInput = {};
    if (query.courseId) where.courseId = query.courseId;
    if (query.unitId) where.unitId = query.unitId;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }
    const orderBy: Prisma.ProjectOrderByWithRelationInput = { createdAt: 'desc' };
    const { items, total } = await this.repo.findAll({ skip, take: pageSize, where, orderBy });
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async listForUnit(unitId: string): Promise<ProjectListItem[]> {
    return this.repo.findByUnit(unitId);
  }

  async listForCourse(courseId: string): Promise<ProjectListItem[]> {
    return this.repo.findByCourse(courseId);
  }

  async findById(id: string): Promise<ProjectListItem> {
    const p = await this.repo.findById(id);
    if (!p) throw new NotFoundException(`Project ${id} not found`);
    return p;
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    const data: Prisma.ProjectCreateInput = {
      title: dto.title,
      description: dto.description,
      imageUrl: dto.imageUrl,
      ...(dto.deadline && { deadline: new Date(dto.deadline) }),
      totalMarks: dto.totalMarks ?? 100,
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.courseId && { course: { connect: { id: dto.courseId } } }),
      ...(dto.unitId && { unit: { connect: { id: dto.unitId } } }),
    };
    return this.repo.create(data);
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.repo.findById(id);
    if (!project) throw new NotFoundException(`Project ${id} not found`);

    const data: Prisma.ProjectUpdateInput = {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      ...(dto.deadline !== undefined && {
        deadline: dto.deadline ? new Date(dto.deadline) : null,
      }),
      ...(dto.totalMarks !== undefined && { totalMarks: dto.totalMarks }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.courseId !== undefined && {
        course: dto.courseId ? { connect: { id: dto.courseId } } : { disconnect: true },
      }),
      ...(dto.unitId !== undefined && {
        unit: dto.unitId ? { connect: { id: dto.unitId } } : { disconnect: true },
      }),
    };
    return this.repo.update(id, data);
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    const p = await this.repo.findById(id);
    if (!p) throw new NotFoundException(`Project ${id} not found`);
    await this.repo.softDelete(id);
    return { id, deleted: true };
  }

  // ─── Submissions ──────────────────────────────────────────────────────────

  async submit(
    projectId: string,
    dto: CreateProjectSubmissionDto,
    actor: ActorContext,
  ): Promise<ProjectSubmissionItem> {
    const project = await this.repo.findById(projectId);
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    if (!project.isActive) {
      throw new ConflictException('Project is not accepting submissions');
    }

    const now = new Date();
    await this.repo.upsertSubmission(projectId, actor.id, {
      status: SubmissionStatus.SUBMITTED,
      fileName: dto.fileName,
      fileSize: dto.fileSize ?? null,
      fileUrl: dto.fileUrl ?? null,
      submittedAt: now,
    });
    const created = await this.repo.findSubmission(projectId, actor.id);
    if (!created) throw new NotFoundException('Submission not found after upsert');
    return created;
  }

  async listSubmissions(
    projectId: string,
    actor: ActorContext,
  ): Promise<ProjectSubmissionItem[]> {
    const project = await this.repo.findById(projectId);
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    if (actor.role === UserRole.STUDENT) {
      const own = await this.repo.findSubmission(projectId, actor.id);
      return own ? [own] : [];
    }
    return this.repo.listSubmissions(projectId);
  }

  async listMySubmissions(actor: ActorContext): Promise<ProjectSubmissionItem[]> {
    return this.repo.listSubmissionsForUser(actor.id);
  }

  async grade(
    submissionId: string,
    dto: GradeProjectSubmissionDto,
    actor: ActorContext,
  ): Promise<ProjectSubmissionItem> {
    if (actor.role === UserRole.STUDENT) {
      throw new ForbiddenException('Only instructors or admins can grade submissions');
    }
    const sub = await this.repo.findSubmissionById(submissionId);
    if (!sub) throw new NotFoundException(`Submission ${submissionId} not found`);
    const project = await this.repo.findById(sub.projectId);
    if (!project) throw new NotFoundException(`Project ${sub.projectId} not found`);
    if (dto.marksAwarded > project.totalMarks) {
      throw new ConflictException(
        `marksAwarded (${dto.marksAwarded}) exceeds project totalMarks (${project.totalMarks})`,
      );
    }
    await this.repo.updateSubmission(submissionId, {
      status: dto.status ?? SubmissionStatus.GRADED,
      marksAwarded: dto.marksAwarded,
      gradedAt: new Date(),
    });
    const updated = await this.repo.findSubmissionById(submissionId);
    if (!updated) throw new NotFoundException('Submission not found after grading');
    return updated;
  }

  async withdrawSubmission(
    submissionId: string,
    actor: ActorContext,
  ): Promise<{ id: string; deleted: true }> {
    const sub = await this.repo.findSubmissionById(submissionId);
    if (!sub) throw new NotFoundException(`Submission ${submissionId} not found`);
    if (actor.role === UserRole.STUDENT && sub.userId !== actor.id) {
      throw new ForbiddenException('You can only withdraw your own submission');
    }
    await this.repo.softDeleteSubmission(submissionId);
    return { id: submissionId, deleted: true };
  }
}
