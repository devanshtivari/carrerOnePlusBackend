import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Assignment, AssignmentStatus, Prisma, SubmissionStatus, UserRole } from '@prisma/client';

import {
  PaginatedResult,
  buildPaginatedResult,
} from '../../catalog/dto/pagination.dto';
import {
  CreateAssignmentSubmissionDto,
  GradeAssignmentSubmissionDto,
} from '../dto/assignment-submission.dto';
import { CreateAssignmentDto } from '../dto/create-assignment.dto';
import { ListAssignmentsDto } from '../dto/list-assignments.dto';
import { UpdateAssignmentDto } from '../dto/update-assignment.dto';
import {
  AssignmentListItem,
  AssignmentSubmissionItem,
  AssignmentsRepository,
} from './assignments.repository';

interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class AssignmentsService {
  constructor(private readonly repo: AssignmentsRepository) {}

  async list(query: ListAssignmentsDto): Promise<PaginatedResult<AssignmentListItem>> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.AssignmentWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.classId) where.classId = query.classId;
    if (query.courseId) where.courseId = query.courseId;
    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }
    const orderBy: Prisma.AssignmentOrderByWithRelationInput = { dueDate: 'asc' };
    const { items, total } = await this.repo.findAll({ skip, take: pageSize, where, orderBy });
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async listForClass(classId: string): Promise<AssignmentListItem[]> {
    return this.repo.findByClass(classId);
  }

  async findById(id: string): Promise<AssignmentListItem> {
    const a = await this.repo.findById(id);
    if (!a) throw new NotFoundException(`Assignment ${id} not found`);
    return a;
  }

  async create(dto: CreateAssignmentDto): Promise<Assignment> {
    const data: Prisma.AssignmentCreateInput = {
      title: dto.title,
      description: dto.description,
      ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
      ...(dto.status && { status: dto.status }),
      ...(dto.totalStudents !== undefined && { totalStudents: dto.totalStudents }),
      ...(dto.classId && { class: { connect: { id: dto.classId } } }),
      ...(dto.courseId && { course: { connect: { id: dto.courseId } } }),
    };
    return this.repo.create(data);
  }

  async update(id: string, dto: UpdateAssignmentDto): Promise<Assignment> {
    const assignment = await this.repo.findById(id);
    if (!assignment) throw new NotFoundException(`Assignment ${id} not found`);
    const data: Prisma.AssignmentUpdateInput = {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.dueDate !== undefined && {
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.totalStudents !== undefined && { totalStudents: dto.totalStudents }),
      ...(dto.classId !== undefined && {
        class: dto.classId ? { connect: { id: dto.classId } } : { disconnect: true },
      }),
      ...(dto.courseId !== undefined && {
        course: dto.courseId ? { connect: { id: dto.courseId } } : { disconnect: true },
      }),
    };
    return this.repo.update(id, data);
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    const a = await this.repo.findById(id);
    if (!a) throw new NotFoundException(`Assignment ${id} not found`);
    await this.repo.softDelete(id);
    return { id, deleted: true };
  }

  // ─── Submissions ──────────────────────────────────────────────────────────

  async submit(
    assignmentId: string,
    dto: CreateAssignmentSubmissionDto,
    actor: ActorContext,
  ): Promise<AssignmentSubmissionItem> {
    const a = await this.repo.findById(assignmentId);
    if (!a) throw new NotFoundException(`Assignment ${assignmentId} not found`);
    if (a.status === AssignmentStatus.ARCHIVED) {
      throw new ConflictException('Assignment is archived');
    }
    const existing = await this.repo.findSubmission(assignmentId, actor.id);
    const isNew = !existing;
    await this.repo.upsertSubmission(assignmentId, actor.id, {
      status: SubmissionStatus.SUBMITTED,
      fileUrl: dto.fileUrl ?? null,
      submittedAt: new Date(),
    });
    if (isNew) {
      await this.repo.incrementSubmittedCount(assignmentId, 1);
    }
    const created = await this.repo.findSubmission(assignmentId, actor.id);
    if (!created) throw new NotFoundException('Submission not found after upsert');
    return created;
  }

  async listSubmissions(
    assignmentId: string,
    actor: ActorContext,
  ): Promise<AssignmentSubmissionItem[]> {
    const a = await this.repo.findById(assignmentId);
    if (!a) throw new NotFoundException(`Assignment ${assignmentId} not found`);
    if (actor.role === UserRole.STUDENT) {
      const own = await this.repo.findSubmission(assignmentId, actor.id);
      return own ? [own] : [];
    }
    return this.repo.listSubmissions(assignmentId);
  }

  async listMySubmissions(actor: ActorContext): Promise<AssignmentSubmissionItem[]> {
    return this.repo.listSubmissionsForUser(actor.id);
  }

  async grade(
    submissionId: string,
    dto: GradeAssignmentSubmissionDto,
    actor: ActorContext,
  ): Promise<AssignmentSubmissionItem> {
    if (actor.role === UserRole.STUDENT) {
      throw new ForbiddenException('Only instructors or admins can grade submissions');
    }
    if (dto.marksAwarded > dto.totalMarks) {
      throw new ConflictException('marksAwarded cannot exceed totalMarks');
    }
    const sub = await this.repo.findSubmissionById(submissionId);
    if (!sub) throw new NotFoundException(`Submission ${submissionId} not found`);

    await this.repo.updateSubmission(submissionId, {
      status: dto.status ?? SubmissionStatus.GRADED,
      marksAwarded: dto.marksAwarded,
      totalMarks: dto.totalMarks,
      gradeLabel: dto.gradeLabel,
      feedback: dto.feedback,
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
    if (sub.status === SubmissionStatus.SUBMITTED || sub.status === SubmissionStatus.GRADED) {
      await this.repo.incrementSubmittedCount(sub.assignmentId, -1);
    }
    return { id: submissionId, deleted: true };
  }
}
