import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Lesson, Prisma, UserRole } from '@prisma/client';

import { ChaptersRepository } from './chapters.repository';
import { CoursesRepository } from './courses.repository';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonsRepository } from './lessons.repository';
import { UnitsRepository } from './units.repository';

interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class LessonsService {
  constructor(
    private readonly repo: LessonsRepository,
    private readonly chaptersRepo: ChaptersRepository,
    private readonly unitsRepo: UnitsRepository,
    private readonly coursesRepo: CoursesRepository,
  ) {}

  async listByChapter(chapterId: string): Promise<Lesson[]> {
    const chapter = await this.chaptersRepo.findById(chapterId);
    if (!chapter) throw new NotFoundException(`Chapter ${chapterId} not found`);
    return this.repo.findAllByChapter(chapterId);
  }

  async findById(id: string): Promise<Lesson> {
    const lesson = await this.repo.findById(id);
    if (!lesson) throw new NotFoundException(`Lesson ${id} not found`);
    return lesson;
  }

  async create(dto: CreateLessonDto, actor: ActorContext): Promise<Lesson> {
    const chapter = await this.chaptersRepo.findById(dto.chapterId);
    if (!chapter) throw new NotFoundException(`Chapter ${dto.chapterId} not found`);
    await this.assertCanWriteForChapter(chapter.unitId, actor);

    const conflict = await this.repo.findByChapterAndPosition(dto.chapterId, dto.position);
    if (conflict) {
      throw new ConflictException(`Lesson at position ${dto.position} already exists`);
    }

    const data: Prisma.LessonCreateInput = {
      title: dto.title,
      type: dto.type,
      durationLabel: dto.durationLabel,
      durationSeconds: dto.durationSeconds,
      position: dto.position,
      contentUrl: dto.contentUrl,
      body: dto.body,
      chapter: { connect: { id: dto.chapterId } },
    };
    return this.repo.create(data);
  }

  async update(id: string, dto: UpdateLessonDto, actor: ActorContext): Promise<Lesson> {
    const lesson = await this.repo.findById(id);
    if (!lesson) throw new NotFoundException(`Lesson ${id} not found`);
    const chapter = await this.chaptersRepo.findById(lesson.chapterId);
    await this.assertCanWriteForChapter(chapter?.unitId, actor);

    if (dto.position !== undefined && dto.position !== lesson.position) {
      const conflict = await this.repo.findByChapterAndPosition(lesson.chapterId, dto.position);
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`Lesson at position ${dto.position} already exists`);
      }
    }

    const data: Prisma.LessonUpdateInput = {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.durationLabel !== undefined && { durationLabel: dto.durationLabel }),
      ...(dto.durationSeconds !== undefined && { durationSeconds: dto.durationSeconds }),
      ...(dto.position !== undefined && { position: dto.position }),
      ...(dto.contentUrl !== undefined && { contentUrl: dto.contentUrl }),
      ...(dto.body !== undefined && { body: dto.body }),
    };
    return this.repo.update(id, data);
  }

  async remove(id: string, actor: ActorContext): Promise<{ id: string; deleted: true }> {
    const lesson = await this.repo.findById(id);
    if (!lesson) throw new NotFoundException(`Lesson ${id} not found`);
    const chapter = await this.chaptersRepo.findById(lesson.chapterId);
    await this.assertCanWriteForChapter(chapter?.unitId, actor);
    await this.repo.softDelete(id);
    return { id, deleted: true };
  }

  private async assertCanWriteForChapter(unitId: string | undefined, actor: ActorContext): Promise<void> {
    if (actor.role === UserRole.ADMIN) return;
    if (!unitId) throw new ForbiddenException('Cannot resolve course ownership');
    const unit = await this.unitsRepo.findById(unitId);
    if (!unit) throw new ForbiddenException('Cannot resolve course ownership');
    const course = await this.coursesRepo.findById(unit.courseId);
    if (actor.role === UserRole.INSTRUCTOR && course?.instructorId === actor.id) return;
    throw new ForbiddenException('You do not have permission to modify this course');
  }
}
