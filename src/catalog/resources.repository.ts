import { Injectable } from '@nestjs/common';
import { Prisma, Resource } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResourcesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ResourceCreateInput): Promise<Resource> {
    return this.prisma.resource.create({ data });
  }

  async findById(id: string): Promise<Resource | null> {
    return this.prisma.resource.findUnique({ where: { id } });
  }

  async findAllByUnit(unitId: string): Promise<Resource[]> {
    return this.prisma.resource.findMany({
      where: { unitId },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });
  }

  async update(id: string, data: Prisma.ResourceUpdateInput): Promise<Resource> {
    return this.prisma.resource.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Resource> {
    return this.prisma.resource.delete({ where: { id } });
  }
}
