import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Unit, UserRole } from '@prisma/client';

import { CoursesRepository } from './courses.repository';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UnitsRepository } from './units.repository';

interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class UnitsService {
  constructor(
    private readonly repo: UnitsRepository,
    private readonly coursesRepo: CoursesRepository,
  ) {}

  async listByCourse(courseId: string): Promise<Unit[]> {
    const course = await this.coursesRepo.findById(courseId);
    if (!course) throw new NotFoundException(`Course ${courseId} not found`);
    return this.repo.findAllByCourse(courseId);
  }

  async findById(id: string): Promise<Unit> {
    const unit = await this.repo.findById(id);
    if (!unit) throw new NotFoundException(`Unit ${id} not found`);
    return unit;
  }

  async create(dto: CreateUnitDto, actor: ActorContext): Promise<Unit> {
    const course = await this.coursesRepo.findById(dto.courseId);
    if (!course) throw new NotFoundException(`Course ${dto.courseId} not found`);
    this.assertCanWrite(course, actor);

    const conflict = await this.repo.findByCourseAndModule(dto.courseId, dto.moduleNumber);
    if (conflict) {
      throw new ConflictException(
        `Module #${dto.moduleNumber} already exists for course ${dto.courseId}`,
      );
    }

    const data: Prisma.UnitCreateInput = {
      moduleNumber: dto.moduleNumber,
      title: dto.title,
      description: dto.description,
      imageUrl: dto.imageUrl,
      durationLabel: dto.durationLabel,
      topicCount: dto.topicCount,
      position: dto.position,
      status: dto.status,
      isLocked: dto.isLocked,
      hours: dto.hours,
      course: { connect: { id: dto.courseId } },
    };
    return this.repo.create(data);
  }

  async update(id: string, dto: UpdateUnitDto, actor: ActorContext): Promise<Unit> {
    const unit = await this.repo.findById(id);
    if (!unit) throw new NotFoundException(`Unit ${id} not found`);
    const course = await this.coursesRepo.findById(unit.courseId);
    this.assertCanWrite(course, actor);

    if (dto.moduleNumber && dto.moduleNumber !== unit.moduleNumber) {
      const conflict = await this.repo.findByCourseAndModule(unit.courseId, dto.moduleNumber);
      if (conflict && conflict.id !== id) {
        throw new ConflictException(
          `Module #${dto.moduleNumber} already exists for this course`,
        );
      }
    }

    const data: Prisma.UnitUpdateInput = {
      ...(dto.moduleNumber !== undefined && { moduleNumber: dto.moduleNumber }),
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      ...(dto.durationLabel !== undefined && { durationLabel: dto.durationLabel }),
      ...(dto.topicCount !== undefined && { topicCount: dto.topicCount }),
      ...(dto.position !== undefined && { position: dto.position }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.isLocked !== undefined && { isLocked: dto.isLocked }),
      ...(dto.hours !== undefined && { hours: dto.hours }),
    };
    return this.repo.update(id, data);
  }

  async remove(id: string, actor: ActorContext): Promise<{ id: string; deleted: true }> {
    const unit = await this.repo.findById(id);
    if (!unit) throw new NotFoundException(`Unit ${id} not found`);
    const course = await this.coursesRepo.findById(unit.courseId);
    this.assertCanWrite(course, actor);
    await this.repo.softDelete(id);
    return { id, deleted: true };
  }

  private assertCanWrite(course: { instructorId: string | null } | null, actor: ActorContext): void {
    if (actor.role === UserRole.ADMIN) return;
    if (actor.role === UserRole.INSTRUCTOR && course?.instructorId === actor.id) return;
    throw new ForbiddenException('You do not have permission to modify this course');
  }
}
