import { Injectable, NotFoundException } from '@nestjs/common';
import { Announcement, AnnouncementAudience, Prisma, UserRole } from '@prisma/client';

import { PaginatedResult, buildPaginatedResult } from '../catalog/dto/pagination.dto';
import { AnnouncementsRepository } from './announcements.repository';
import {
  CreateAnnouncementDto,
  ListAnnouncementsDto,
  UpdateAnnouncementDto,
} from './dto/announcement.dto';

interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class AnnouncementsService {
  constructor(private readonly repo: AnnouncementsRepository) {}

  async list(
    query: ListAnnouncementsDto,
    audience?: AnnouncementAudience,
  ): Promise<PaginatedResult<Announcement>> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.AnnouncementWhereInput = {};
    const audienceFilter = query.audience ?? audience;
    if (audienceFilter) {
      where.OR = [{ audience: audienceFilter }, { audience: AnnouncementAudience.ALL }];
    }
    // `activeOnly` is the public alias sent by the frontend; `isActive` is the
    // canonical DB column. Either one (or both) may be present — prefer the
    // explicit `isActive` if a caller sets both.
    const activeFilter = query.isActive ?? query.activeOnly;
    if (activeFilter !== undefined) where.isActive = activeFilter;

    const { items, total } = await this.repo.findAll({
      skip,
      take: pageSize,
      where,
      orderBy: { publishedAt: 'desc' },
    });
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async findById(id: string): Promise<Announcement> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundException(`Announcement ${id} not found`);
    return found;
  }

  async create(dto: CreateAnnouncementDto, actor: ActorContext): Promise<Announcement> {
    return this.repo.create({
      title: dto.title,
      description: dto.description,
      audience: dto.audience ?? AnnouncementAudience.ALL,
      tag: dto.tag,
      primaryCtaText: dto.primaryCtaText,
      primaryCtaUrl: dto.primaryCtaUrl,
      secondaryCtaText: dto.secondaryCtaText,
      secondaryCtaUrl: dto.secondaryCtaUrl,
      sponsorName: dto.sponsorName,
      imageUrl: dto.imageUrl,
      themeColor: dto.themeColor,
      publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      isActive: dto.isActive ?? true,
      author: { connect: { id: actor.id } },
    });
  }

  async update(id: string, dto: UpdateAnnouncementDto): Promise<Announcement> {
    await this.findById(id);
    const data: Prisma.AnnouncementUpdateInput = {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.audience !== undefined && { audience: dto.audience }),
      ...(dto.tag !== undefined && { tag: dto.tag }),
      ...(dto.primaryCtaText !== undefined && { primaryCtaText: dto.primaryCtaText }),
      ...(dto.primaryCtaUrl !== undefined && { primaryCtaUrl: dto.primaryCtaUrl }),
      ...(dto.secondaryCtaText !== undefined && { secondaryCtaText: dto.secondaryCtaText }),
      ...(dto.secondaryCtaUrl !== undefined && { secondaryCtaUrl: dto.secondaryCtaUrl }),
      ...(dto.sponsorName !== undefined && { sponsorName: dto.sponsorName }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      ...(dto.themeColor !== undefined && { themeColor: dto.themeColor }),
      ...(dto.publishedAt !== undefined && { publishedAt: new Date(dto.publishedAt) }),
      ...(dto.expiresAt !== undefined && {
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };
    return this.repo.update(id, data);
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    await this.findById(id);
    await this.repo.softDelete(id);
    return { id, deleted: true };
  }
}
