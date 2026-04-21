import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Chapter, Prisma, UserRole } from '@prisma/client';

import { ChaptersRepository } from './chapters.repository';
import { CoursesRepository } from './courses.repository';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { UnitsRepository } from './units.repository';

interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class ChaptersService {
  constructor(
    private readonly repo: ChaptersRepository,
    private readonly unitsRepo: UnitsRepository,
    private readonly coursesRepo: CoursesRepository,
  ) {}

  async listByUnit(unitId: string): Promise<Chapter[]> {
    const unit = await this.unitsRepo.findById(unitId);
    if (!unit) throw new NotFoundException(`Unit ${unitId} not found`);
    return this.repo.findAllByUnit(unitId);
  }

  async findById(id: string): Promise<Chapter> {
    const chapter = await this.repo.findById(id);
    if (!chapter) throw new NotFoundException(`Chapter ${id} not found`);
    return chapter;
  }

  async create(dto: CreateChapterDto, actor: ActorContext): Promise<Chapter> {
    const unit = await this.unitsRepo.findById(dto.unitId);
    if (!unit) throw new NotFoundException(`Unit ${dto.unitId} not found`);
    await this.assertCanWriteForUnit(unit.courseId, actor);

    const conflict = await this.repo.findByUnitAndPosition(dto.unitId, dto.position);
    if (conflict) {
      throw new ConflictException(`Chapter at position ${dto.position} already exists`);
    }

    const data: Prisma.ChapterCreateInput = {
      title: dto.title,
      description: dto.description,
      position: dto.position,
      durationLabel: dto.durationLabel,
      totalLessons: dto.totalLessons,
      unit: { connect: { id: dto.unitId } },
    };
    return this.repo.create(data);
  }

  async update(id: string, dto: UpdateChapterDto, actor: ActorContext): Promise<Chapter> {
    const chapter = await this.repo.findById(id);
    if (!chapter) throw new NotFoundException(`Chapter ${id} not found`);
    const unit = await this.unitsRepo.findById(chapter.unitId);
    await this.assertCanWriteForUnit(unit?.courseId, actor);

    if (dto.position !== undefined && dto.position !== chapter.position) {
      const conflict = await this.repo.findByUnitAndPosition(chapter.unitId, dto.position);
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`Chapter at position ${dto.position} already exists`);
      }
    }

    const data: Prisma.ChapterUpdateInput = {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.position !== undefined && { position: dto.position }),
      ...(dto.durationLabel !== undefined && { durationLabel: dto.durationLabel }),
      ...(dto.totalLessons !== undefined && { totalLessons: dto.totalLessons }),
    };
    return this.repo.update(id, data);
  }

  async remove(id: string, actor: ActorContext): Promise<{ id: string; deleted: true }> {
    const chapter = await this.repo.findById(id);
    if (!chapter) throw new NotFoundException(`Chapter ${id} not found`);
    const unit = await this.unitsRepo.findById(chapter.unitId);
    await this.assertCanWriteForUnit(unit?.courseId, actor);
    await this.repo.softDelete(id);
    return { id, deleted: true };
  }

  private async assertCanWriteForUnit(courseId: string | undefined, actor: ActorContext): Promise<void> {
    if (actor.role === UserRole.ADMIN) return;
    if (!courseId) throw new ForbiddenException('Cannot resolve course ownership');
    const course = await this.coursesRepo.findById(courseId);
    if (actor.role === UserRole.INSTRUCTOR && course?.instructorId === actor.id) return;
    throw new ForbiddenException('You do not have permission to modify this course');
  }
}
