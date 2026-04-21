import { Injectable } from '@nestjs/common';
import { CalendarEvent, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface FindCalendarEventsArgs {
  skip: number;
  take: number;
  where: Prisma.CalendarEventWhereInput;
  orderBy: Prisma.CalendarEventOrderByWithRelationInput;
}

@Injectable()
export class CalendarEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CalendarEventCreateInput): Promise<CalendarEvent> {
    return this.prisma.calendarEvent.create({ data });
  }

  async findAll({
    skip,
    take,
    where,
    orderBy,
  }: FindCalendarEventsArgs): Promise<{ items: CalendarEvent[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.calendarEvent.findMany({ where, orderBy, skip, take }),
      this.prisma.calendarEvent.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<CalendarEvent | null> {
    return this.prisma.calendarEvent.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.CalendarEventUpdateInput): Promise<CalendarEvent> {
    return this.prisma.calendarEvent.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<CalendarEvent> {
    return this.prisma.calendarEvent.delete({ where: { id } });
  }
}
