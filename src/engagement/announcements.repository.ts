import { Injectable } from '@nestjs/common';
import { Announcement, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface FindAllAnnouncementsArgs {
  skip: number;
  take: number;
  where: Prisma.AnnouncementWhereInput;
  orderBy: Prisma.AnnouncementOrderByWithRelationInput;
}

@Injectable()
export class AnnouncementsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.AnnouncementCreateInput): Promise<Announcement> {
    return this.prisma.announcement.create({ data });
  }

  async findAll({
    skip,
    take,
    where,
    orderBy,
  }: FindAllAnnouncementsArgs): Promise<{ items: Announcement[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.announcement.findMany({ where, orderBy, skip, take }),
      this.prisma.announcement.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<Announcement | null> {
    return this.prisma.announcement.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.AnnouncementUpdateInput): Promise<Announcement> {
    return this.prisma.announcement.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Announcement> {
    return this.prisma.announcement.delete({ where: { id } });
  }
}
