import { Injectable, NotFoundException } from '@nestjs/common';
import { Lab, LabRuntimeStatus, Prisma } from '@prisma/client';

import { PaginatedResult, buildPaginatedResult } from '../catalog/dto/pagination.dto';
import { CreateLabDto, ListLabsDto, UpdateLabDto } from './dto/lab.dto';
import { LabsRepository } from './labs.repository';

@Injectable()
export class LabsService {
  constructor(private readonly repo: LabsRepository) {}

  async list(query: ListLabsDto): Promise<PaginatedResult<Lab>> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;
    const where: Prisma.LabWhereInput = {};
    if (query.status) where.status = query.status;

    const { items, total } = await this.repo.findAll({
      skip,
      take: pageSize,
      where,
      orderBy: { name: 'asc' },
    });
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async findById(id: string): Promise<Lab> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundException(`Lab ${id} not found`);
    return found;
  }

  async create(dto: CreateLabDto): Promise<Lab> {
    return this.repo.create({
      name: dto.name,
      status: dto.status ?? LabRuntimeStatus.AVAILABLE,
      uptimeNote: dto.uptimeNote,
      activeUsers: dto.activeUsers ?? 0,
    });
  }

  async update(id: string, dto: UpdateLabDto): Promise<Lab> {
    await this.findById(id);
    return this.repo.update(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.uptimeNote !== undefined && { uptimeNote: dto.uptimeNote }),
      ...(dto.activeUsers !== undefined && { activeUsers: dto.activeUsers }),
    });
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    await this.findById(id);
    await this.repo.softDelete(id);
    return { id, deleted: true };
  }
}
