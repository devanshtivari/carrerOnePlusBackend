import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Resource, UserRole } from '@prisma/client';

import { CoursesRepository } from './courses.repository';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ResourcesRepository } from './resources.repository';
import { UnitsRepository } from './units.repository';

interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class ResourcesService {
  constructor(
    private readonly repo: ResourcesRepository,
    private readonly unitsRepo: UnitsRepository,
    private readonly coursesRepo: CoursesRepository,
  ) {}

  async listByUnit(unitId: string): Promise<Resource[]> {
    const unit = await this.unitsRepo.findById(unitId);
    if (!unit) throw new NotFoundException(`Unit ${unitId} not found`);
    return this.repo.findAllByUnit(unitId);
  }

  async findById(id: string): Promise<Resource> {
    const resource = await this.repo.findById(id);
    if (!resource) throw new NotFoundException(`Resource ${id} not found`);
    return resource;
  }

  async create(dto: CreateResourceDto, actor: ActorContext): Promise<Resource> {
    const unit = await this.unitsRepo.findById(dto.unitId);
    if (!unit) throw new NotFoundException(`Unit ${dto.unitId} not found`);
    await this.assertCanWrite(unit.courseId, actor);

    const data: Prisma.ResourceCreateInput = {
      name: dto.name,
      kind: dto.kind,
      url: dto.url,
      sizeLabel: dto.sizeLabel,
      position: dto.position,
      unit: { connect: { id: dto.unitId } },
    };
    return this.repo.create(data);
  }

  async update(id: string, dto: UpdateResourceDto, actor: ActorContext): Promise<Resource> {
    const resource = await this.repo.findById(id);
    if (!resource) throw new NotFoundException(`Resource ${id} not found`);
    if (resource.unitId) {
      const unit = await this.unitsRepo.findById(resource.unitId);
      await this.assertCanWrite(unit?.courseId, actor);
    } else if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can edit unattached resources');
    }

    const data: Prisma.ResourceUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.kind !== undefined && { kind: dto.kind }),
      ...(dto.url !== undefined && { url: dto.url }),
      ...(dto.sizeLabel !== undefined && { sizeLabel: dto.sizeLabel }),
      ...(dto.position !== undefined && { position: dto.position }),
    };
    return this.repo.update(id, data);
  }

  async remove(id: string, actor: ActorContext): Promise<{ id: string; deleted: true }> {
    const resource = await this.repo.findById(id);
    if (!resource) throw new NotFoundException(`Resource ${id} not found`);
    if (resource.unitId) {
      const unit = await this.unitsRepo.findById(resource.unitId);
      await this.assertCanWrite(unit?.courseId, actor);
    } else if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete unattached resources');
    }
    await this.repo.softDelete(id);
    return { id, deleted: true };
  }

  private async assertCanWrite(courseId: string | undefined, actor: ActorContext): Promise<void> {
    if (actor.role === UserRole.ADMIN) return;
    if (!courseId) throw new ForbiddenException('Cannot resolve course ownership');
    const course = await this.coursesRepo.findById(courseId);
    if (actor.role === UserRole.INSTRUCTOR && course?.instructorId === actor.id) return;
    throw new ForbiddenException('You do not have permission to modify this course');
  }
}
