import { Injectable } from '@nestjs/common';
import { Prisma, Report } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface FindReportsArgs {
  skip: number;
  take: number;
  where: Prisma.ReportWhereInput;
  orderBy: Prisma.ReportOrderByWithRelationInput;
}

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ReportCreateInput): Promise<Report> {
    return this.prisma.report.create({ data });
  }

  async findAll({
    skip,
    take,
    where,
    orderBy,
  }: FindReportsArgs): Promise<{ items: Report[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.report.findMany({ where, orderBy, skip, take }),
      this.prisma.report.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<Report | null> {
    return this.prisma.report.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.ReportUpdateInput): Promise<Report> {
    return this.prisma.report.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Report> {
    return this.prisma.report.delete({ where: { id } });
  }
}
