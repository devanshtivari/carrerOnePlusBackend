import { Injectable, NotFoundException } from '@nestjs/common';
import { Alert, AlertPriority, Prisma, UserRole } from '@prisma/client';

import { PaginatedResult, buildPaginatedResult } from '../catalog/dto/pagination.dto';
import { AlertsRepository } from './alerts.repository';
import { CreateAlertDto, ListAlertsDto, UpdateAlertDto } from './dto/alert.dto';

interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class AlertsService {
  constructor(private readonly repo: AlertsRepository) {}

  async list(query: ListAlertsDto): Promise<PaginatedResult<Alert>> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.AlertWhereInput = {};
    if (query.priority) where.priority = query.priority;
    if (query.resolved === true) where.resolvedAt = { not: null };
    if (query.resolved === false) where.resolvedAt = null;

    const { items, total } = await this.repo.findAll({
      skip,
      take: pageSize,
      where,
      orderBy: [{ resolvedAt: 'asc' as const }, { createdAt: 'desc' as const }],
    });
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async findById(id: string): Promise<Alert> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundException(`Alert ${id} not found`);
    return found;
  }

  async create(dto: CreateAlertDto): Promise<Alert> {
    return this.repo.create({
      title: dto.title,
      message: dto.message,
      priority: dto.priority ?? AlertPriority.MEDIUM,
      studentsAffected: dto.studentsAffected,
      timeInfo: dto.timeInfo,
    });
  }

  async update(id: string, dto: UpdateAlertDto): Promise<Alert> {
    await this.findById(id);
    return this.repo.update(id, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.message !== undefined && { message: dto.message }),
      ...(dto.priority !== undefined && { priority: dto.priority }),
      ...(dto.studentsAffected !== undefined && { studentsAffected: dto.studentsAffected }),
      ...(dto.timeInfo !== undefined && { timeInfo: dto.timeInfo }),
    });
  }

  async resolve(id: string, actor: ActorContext): Promise<Alert> {
    await this.findById(id);
    return this.repo.resolve(id, actor.id);
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    await this.findById(id);
    await this.repo.softDelete(id);
    return { id, deleted: true };
  }
}
