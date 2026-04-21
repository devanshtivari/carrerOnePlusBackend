import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Test } from '@prisma/client';

import {
  PaginatedResult,
  buildPaginatedResult,
} from '../../catalog/dto/pagination.dto';
import { CoursesRepository } from '../../catalog/courses.repository';
import { CreateTestDto } from '../dto/create-test.dto';
import { ListTestsDto } from '../dto/list-tests.dto';
import { UpdateTestDto } from '../dto/update-test.dto';
import { TestListItem, TestDetail, TestsRepository } from './tests.repository';

@Injectable()
export class TestsService {
  constructor(
    private readonly repo: TestsRepository,
    private readonly coursesRepo: CoursesRepository,
  ) {}

  async list(query: ListTestsDto): Promise<PaginatedResult<TestListItem>> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.TestWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.courseId) where.courseId = query.courseId;
    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { code: { contains: term, mode: 'insensitive' } },
        { courseLabel: { contains: term, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.TestOrderByWithRelationInput = { scheduledAt: 'asc' };
    const { items, total } = await this.repo.findAll({ skip, take: pageSize, where, orderBy });
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async findById(id: string): Promise<TestDetail> {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundException(`Test ${id} not found`);
    return t;
  }

  async findByCode(code: string): Promise<TestDetail> {
    const t = await this.repo.findByCode(code);
    if (!t) throw new NotFoundException(`Test ${code} not found`);
    return t;
  }

  async create(dto: CreateTestDto): Promise<Test> {
    const existing = await this.repo.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(`Test code "${dto.code}" already exists`);
    }
    if (dto.courseId) {
      const c = await this.coursesRepo.findById(dto.courseId);
      if (!c) throw new NotFoundException(`Course ${dto.courseId} not found`);
    }
    const data: Prisma.TestCreateInput = {
      code: dto.code,
      title: dto.title,
      description: dto.description,
      courseLabel: dto.courseLabel,
      durationMinutes: dto.durationMinutes ?? 0,
      totalMarks: dto.totalMarks ?? 0,
      totalQuestions: dto.totalQuestions ?? 0,
      ...(dto.type && { type: dto.type }),
      ...(dto.status && { status: dto.status }),
      ...(dto.scheduledAt && { scheduledAt: new Date(dto.scheduledAt) }),
      ...(dto.courseId && { course: { connect: { id: dto.courseId } } }),
    };
    return this.repo.create(data);
  }

  async update(id: string, dto: UpdateTestDto): Promise<Test> {
    const test = await this.repo.findById(id);
    if (!test) throw new NotFoundException(`Test ${id} not found`);

    if (dto.code && dto.code !== test.code) {
      const conflict = await this.repo.findByCode(dto.code);
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`Test code "${dto.code}" already exists`);
      }
    }

    if (dto.courseId) {
      const c = await this.coursesRepo.findById(dto.courseId);
      if (!c) throw new NotFoundException(`Course ${dto.courseId} not found`);
    }

    const data: Prisma.TestUpdateInput = {
      ...(dto.code !== undefined && { code: dto.code }),
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.courseLabel !== undefined && { courseLabel: dto.courseLabel }),
      ...(dto.durationMinutes !== undefined && { durationMinutes: dto.durationMinutes }),
      ...(dto.totalMarks !== undefined && { totalMarks: dto.totalMarks }),
      ...(dto.totalQuestions !== undefined && { totalQuestions: dto.totalQuestions }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.scheduledAt !== undefined && {
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      }),
      ...(dto.courseId !== undefined && {
        course: dto.courseId ? { connect: { id: dto.courseId } } : { disconnect: true },
      }),
    };
    return this.repo.update(id, data);
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundException(`Test ${id} not found`);
    await this.repo.softDelete(id);
    return { id, deleted: true };
  }
}
