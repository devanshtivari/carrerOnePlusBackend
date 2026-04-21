import { Injectable } from '@nestjs/common';
import { Alert, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface FindAlertsArgs {
  skip: number;
  take: number;
  where: Prisma.AlertWhereInput;
  orderBy: Prisma.AlertOrderByWithRelationInput | Prisma.AlertOrderByWithRelationInput[];
}

@Injectable()
export class AlertsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.AlertCreateInput): Promise<Alert> {
    return this.prisma.alert.create({ data });
  }

  async findAll({
    skip,
    take,
    where,
    orderBy,
  }: FindAlertsArgs): Promise<{ items: Alert[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.alert.findMany({ where, orderBy, skip, take }),
      this.prisma.alert.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<Alert | null> {
    return this.prisma.alert.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.AlertUpdateInput): Promise<Alert> {
    return this.prisma.alert.update({ where: { id }, data });
  }

  async resolve(id: string, userId: string): Promise<Alert> {
    return this.prisma.alert.update({
      where: { id },
      data: { resolvedAt: new Date(), resolvedBy: { connect: { id: userId } } },
    });
  }

  async softDelete(id: string): Promise<Alert> {
    return this.prisma.alert.delete({ where: { id } });
  }
}
