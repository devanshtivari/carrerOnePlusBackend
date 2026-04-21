import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Feedback, Prisma, UserRole } from '@prisma/client';

import { PaginatedResult, buildPaginatedResult } from '../catalog/dto/pagination.dto';
import { CreateFeedbackDto, ListFeedbackDto, UpdateFeedbackDto } from './dto/feedback.dto';
import { FeedbackListItem, FeedbackRepository } from './feedback.repository';

interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class FeedbackService {
  constructor(private readonly repo: FeedbackRepository) {}

  async list(
    query: ListFeedbackDto,
    actor: ActorContext,
  ): Promise<PaginatedResult<FeedbackListItem>> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.FeedbackWhereInput = {};
    if (actor.role === UserRole.STUDENT) {
      where.studentId = actor.id;
    } else if (query.studentId) {
      where.studentId = query.studentId;
    }
    if (query.contextType) where.contextType = query.contextType;
    if (query.contextId) where.contextId = query.contextId;

    const { items, total } = await this.repo.findAll({
      skip,
      take: pageSize,
      where,
      orderBy: { createdAt: 'desc' },
    });
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async findById(id: string, actor: ActorContext): Promise<FeedbackListItem> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundException(`Feedback ${id} not found`);
    if (actor.role === UserRole.STUDENT && found.studentId !== actor.id) {
      throw new ForbiddenException('You can only view your own feedback');
    }
    return found;
  }

  async create(dto: CreateFeedbackDto, actor: ActorContext): Promise<Feedback> {
    return this.repo.create({
      student: { connect: { id: dto.studentId } },
      instructor: { connect: { id: actor.id } },
      sectionLabel: dto.sectionLabel,
      body: dto.body,
      gradeLabel: dto.gradeLabel,
      contextType: dto.contextType,
      contextId: dto.contextId,
    });
  }

  async update(id: string, dto: UpdateFeedbackDto, actor: ActorContext): Promise<Feedback> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundException(`Feedback ${id} not found`);
    if (actor.role === UserRole.INSTRUCTOR && found.instructorId !== actor.id) {
      throw new ForbiddenException('You can only edit feedback you authored');
    }
    return this.repo.update(id, {
      ...(dto.body !== undefined && { body: dto.body }),
      ...(dto.sectionLabel !== undefined && { sectionLabel: dto.sectionLabel }),
      ...(dto.gradeLabel !== undefined && { gradeLabel: dto.gradeLabel }),
    });
  }

  async remove(id: string, actor: ActorContext): Promise<{ id: string; deleted: true }> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundException(`Feedback ${id} not found`);
    if (actor.role === UserRole.INSTRUCTOR && found.instructorId !== actor.id) {
      throw new ForbiddenException('You can only delete feedback you authored');
    }
    await this.repo.softDelete(id);
    return { id, deleted: true };
  }
}
