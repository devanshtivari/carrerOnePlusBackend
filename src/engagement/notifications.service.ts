import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Notification, Prisma, UserRole } from '@prisma/client';

import { PaginatedResult, buildPaginatedResult } from '../catalog/dto/pagination.dto';
import { CreateNotificationDto, ListNotificationsDto } from './dto/notification.dto';
import { NotificationsRepository } from './notifications.repository';

interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly repo: NotificationsRepository) {}

  async listForUser(
    userId: string,
    query: ListNotificationsDto,
  ): Promise<PaginatedResult<Notification> & { unread: number }> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.NotificationWhereInput = { userId };
    if (query.unreadOnly) where.readAt = null;
    if (query.type) where.type = query.type;

    const { items, total, unread } = await this.repo.findAll({
      skip,
      take: pageSize,
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { ...buildPaginatedResult(items, total, page, pageSize), unread };
  }

  async create(dto: CreateNotificationDto, actor: ActorContext): Promise<Notification> {
    if (actor.role === UserRole.STUDENT && actor.id !== dto.userId) {
      throw new ForbiddenException('Students cannot send notifications to other users');
    }
    return this.repo.create({
      user: { connect: { id: dto.userId } },
      type: dto.type,
      title: dto.title,
      body: dto.body,
      link: dto.link,
    });
  }

  async markRead(id: string, actor: ActorContext): Promise<Notification> {
    const notif = await this.repo.findById(id);
    if (!notif) throw new NotFoundException(`Notification ${id} not found`);
    if (notif.userId !== actor.id && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own notifications');
    }
    if (notif.readAt) return notif;
    return this.repo.markRead(id);
  }

  async markAllRead(actor: ActorContext): Promise<{ count: number }> {
    return this.repo.markAllRead(actor.id);
  }

  async remove(id: string, actor: ActorContext): Promise<{ id: string; deleted: true }> {
    const notif = await this.repo.findById(id);
    if (!notif) throw new NotFoundException(`Notification ${id} not found`);
    if (notif.userId !== actor.id && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own notifications');
    }
    await this.repo.softDelete(id);
    return { id, deleted: true };
  }
}
