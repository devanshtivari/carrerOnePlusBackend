import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CalendarEvent, CalendarEventType, Prisma, UserRole } from '@prisma/client';

import { PaginatedResult, buildPaginatedResult } from '../catalog/dto/pagination.dto';
import { CalendarEventsRepository } from './calendar-events.repository';
import {
  CreateCalendarEventDto,
  ListCalendarEventsDto,
  UpdateCalendarEventDto,
} from './dto/calendar-event.dto';

interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class CalendarEventsService {
  constructor(private readonly repo: CalendarEventsRepository) {}

  async list(query: ListCalendarEventsDto): Promise<PaginatedResult<CalendarEvent>> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.CalendarEventWhereInput = {};
    if (query.type) where.type = query.type;
    if (query.from || query.to) {
      where.startsAt = {
        ...(query.from && { gte: new Date(query.from) }),
        ...(query.to && { lte: new Date(query.to) }),
      };
    }

    const { items, total } = await this.repo.findAll({
      skip,
      take: pageSize,
      where,
      orderBy: { startsAt: 'asc' },
    });
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async findById(id: string): Promise<CalendarEvent> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundException(`Calendar event ${id} not found`);
    return found;
  }

  async create(dto: CreateCalendarEventDto, actor: ActorContext): Promise<CalendarEvent> {
    return this.repo.create({
      title: dto.title,
      type: dto.type ?? CalendarEventType.EVENT,
      startsAt: new Date(dto.startsAt),
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      location: dto.location,
      owner: { connect: { id: actor.id } },
    });
  }

  async update(
    id: string,
    dto: UpdateCalendarEventDto,
    actor: ActorContext,
  ): Promise<CalendarEvent> {
    const event = await this.repo.findById(id);
    if (!event) throw new NotFoundException(`Calendar event ${id} not found`);
    if (actor.role === UserRole.INSTRUCTOR && event.ownerId && event.ownerId !== actor.id) {
      throw new ForbiddenException('You can only update your own events');
    }
    return this.repo.update(id, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.startsAt !== undefined && { startsAt: new Date(dto.startsAt) }),
      ...(dto.endsAt !== undefined && {
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      }),
      ...(dto.location !== undefined && { location: dto.location }),
    });
  }

  async remove(id: string, actor: ActorContext): Promise<{ id: string; deleted: true }> {
    const event = await this.repo.findById(id);
    if (!event) throw new NotFoundException(`Calendar event ${id} not found`);
    if (actor.role === UserRole.INSTRUCTOR && event.ownerId && event.ownerId !== actor.id) {
      throw new ForbiddenException('You can only delete your own events');
    }
    await this.repo.softDelete(id);
    return { id, deleted: true };
  }
}
