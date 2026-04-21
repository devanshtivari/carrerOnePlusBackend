import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Report, ReportKind, UserRole } from '@prisma/client';

import { PaginatedResult, buildPaginatedResult } from '../catalog/dto/pagination.dto';
import { CreateReportDto, ListReportsDto, UpdateReportDto } from './dto/report.dto';
import { ReportsRepository } from './reports.repository';

interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class ReportsService {
  constructor(private readonly repo: ReportsRepository) {}

  async list(query: ListReportsDto, actor: ActorContext): Promise<PaginatedResult<Report>> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.ReportWhereInput = {};
    if (actor.role !== UserRole.ADMIN) {
      where.ownerId = actor.id;
    }
    if (query.kind) where.kind = query.kind;

    const { items, total } = await this.repo.findAll({
      skip,
      take: pageSize,
      where,
      orderBy: { generatedAt: 'desc' },
    });
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async findById(id: string, actor: ActorContext): Promise<Report> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundException(`Report ${id} not found`);
    if (actor.role !== UserRole.ADMIN && found.ownerId !== actor.id) {
      throw new ForbiddenException('You can only view your own reports');
    }
    return found;
  }

  async create(dto: CreateReportDto, actor: ActorContext): Promise<Report> {
    return this.repo.create({
      title: dto.title,
      kind: dto.kind ?? ReportKind.CUSTOM,
      iconName: dto.iconName,
      payload: dto.payload as Prisma.InputJsonValue | undefined,
      owner: { connect: { id: actor.id } },
    });
  }

  async update(id: string, dto: UpdateReportDto, actor: ActorContext): Promise<Report> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundException(`Report ${id} not found`);
    if (actor.role !== UserRole.ADMIN && found.ownerId !== actor.id) {
      throw new ForbiddenException('You can only update your own reports');
    }
    return this.repo.update(id, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.kind !== undefined && { kind: dto.kind }),
      ...(dto.iconName !== undefined && { iconName: dto.iconName }),
      ...(dto.payload !== undefined && { payload: dto.payload as Prisma.InputJsonValue }),
    });
  }

  async remove(id: string, actor: ActorContext): Promise<{ id: string; deleted: true }> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundException(`Report ${id} not found`);
    if (actor.role !== UserRole.ADMIN && found.ownerId !== actor.id) {
      throw new ForbiddenException('You can only delete your own reports');
    }
    await this.repo.softDelete(id);
    return { id, deleted: true };
  }
}
