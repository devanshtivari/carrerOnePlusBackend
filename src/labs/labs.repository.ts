import { Injectable } from '@nestjs/common';
import { Lab, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface FindLabsArgs {
  skip: number;
  take: number;
  where: Prisma.LabWhereInput;
  orderBy: Prisma.LabOrderByWithRelationInput;
}

@Injectable()
export class LabsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.LabCreateInput): Promise<Lab> {
    return this.prisma.lab.create({ data });
  }

  async findAll({
    skip,
    take,
    where,
    orderBy,
  }: FindLabsArgs): Promise<{ items: Lab[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.lab.findMany({ where, orderBy, skip, take }),
      this.prisma.lab.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<Lab | null> {
    return this.prisma.lab.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.LabUpdateInput): Promise<Lab> {
    return this.prisma.lab.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Lab> {
    return this.prisma.lab.delete({ where: { id } });
  }
}
