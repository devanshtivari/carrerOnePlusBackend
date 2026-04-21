import { Injectable } from '@nestjs/common';
import { Notification, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface FindNotificationsArgs {
  skip: number;
  take: number;
  where: Prisma.NotificationWhereInput;
  orderBy: Prisma.NotificationOrderByWithRelationInput;
}

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.NotificationCreateInput): Promise<Notification> {
    return this.prisma.notification.create({ data });
  }

  async createMany(rows: Prisma.NotificationCreateManyInput[]): Promise<{ count: number }> {
    return this.prisma.notification.createMany({ data: rows });
  }

  async findAll({
    skip,
    take,
    where,
    orderBy,
  }: FindNotificationsArgs): Promise<{ items: Notification[]; total: number; unread: number }> {
    const [items, total, unread] = await Promise.all([
      this.prisma.notification.findMany({ where, orderBy, skip, take }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { ...where, readAt: null } }),
    ]);
    return { items, total, unread };
  }

  async findById(id: string): Promise<Notification | null> {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  async markRead(id: string): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string): Promise<{ count: number }> {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async softDelete(id: string): Promise<Notification> {
    return this.prisma.notification.delete({ where: { id } });
  }
}
