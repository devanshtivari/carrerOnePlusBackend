import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Course, Prisma, UserRole } from '@prisma/client';

import { CategoriesRepository } from './categories.repository';
import { CoursesRepository, CourseListItem } from './courses.repository';
import { CreateCourseDto } from './dto/create-course.dto';
import { ListCoursesQueryDto } from './dto/list-courses.dto';
import {
  PaginatedResult,
  buildPaginatedResult,
} from './dto/pagination.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class CoursesService {
  constructor(
    private readonly repo: CoursesRepository,
    private readonly categoriesRepo: CategoriesRepository,
  ) {}

  async list(query: ListCoursesQueryDto): Promise<PaginatedResult<CourseListItem>> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.CourseWhereInput = {};

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    } else if (query.category) {
      const category = await this.categoriesRepo.findBySlug(query.category);
      if (!category) {
        return buildPaginatedResult<CourseListItem>([], 0, page, pageSize);
      }
      where.categoryId = category.id;
    }

    if (query.level) where.level = query.level;
    if (query.featured !== undefined) where.isFeatured = query.featured;
    if (query.published !== undefined) where.isPublished = query.published;
    if (query.instructorId) where.instructorId = query.instructorId;

    // Grade filter — courses are tagged `grade:6`, `grade:10`, etc. by the
    // seeder; a course can belong to multiple grades so we use an array
    // `has` lookup rather than an equality comparison.
    if (query.grade) {
      where.tags = { has: `grade:${query.grade}` };
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { tags: { has: term } },
      ];
    }

    const sortBy = query.sortBy ?? 'createdAt';
    const sortDir = query.sortDir ?? 'desc';
    const orderBy: Prisma.CourseOrderByWithRelationInput = { [sortBy]: sortDir };

    const { items, total } = await this.repo.findAll({ skip, take: pageSize, where, orderBy });
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async findById(id: string): Promise<CourseListItem> {
    const course = await this.repo.findById(id);
    if (!course) throw new NotFoundException(`Course ${id} not found`);
    return course;
  }

  async findBySlug(slug: string): Promise<CourseListItem> {
    const course = await this.repo.findBySlug(slug);
    if (!course) throw new NotFoundException(`Course ${slug} not found`);
    return course;
  }

  async create(dto: CreateCourseDto, actor: ActorContext): Promise<Course> {
    const existing = await this.repo.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException(`Course with slug "${dto.slug}" already exists`);
    }

    if (dto.categoryId) {
      const cat = await this.categoriesRepo.findById(dto.categoryId);
      if (!cat) throw new NotFoundException(`Category ${dto.categoryId} not found`);
    }

    // Instructors can only create courses they own; admins can assign to anyone.
    let instructorId = dto.instructorId;
    if (actor.role === UserRole.INSTRUCTOR) {
      if (instructorId && instructorId !== actor.id) {
        throw new ForbiddenException('Instructors can only create courses for themselves');
      }
      instructorId = actor.id;
    }

    const data: Prisma.CourseCreateInput = {
      slug: dto.slug,
      title: dto.title,
      shortName: dto.shortName,
      description: dto.description,
      imageUrl: dto.imageUrl,
      level: dto.level,
      badge: dto.badge,
      priceCents: dto.priceCents,
      originalPriceCents: dto.originalPriceCents,
      currency: dto.currency,
      durationLabel: dto.durationLabel,
      ratingAvg: dto.ratingAvg,
      ratingCount: dto.ratingCount,
      enrolledLabel: dto.enrolledLabel,
      isFeatured: dto.isFeatured,
      isPublished: dto.isPublished,
      classmateCount: dto.classmateCount,
      learnings: dto.learnings,
      tags: dto.tags,
      ...(dto.categoryId && { category: { connect: { id: dto.categoryId } } }),
      ...(instructorId && { instructor: { connect: { id: instructorId } } }),
    };
    return this.repo.create(data);
  }

  async update(id: string, dto: UpdateCourseDto, actor: ActorContext): Promise<Course> {
    const course = await this.repo.findById(id);
    if (!course) throw new NotFoundException(`Course ${id} not found`);

    if (actor.role === UserRole.INSTRUCTOR && course.instructorId !== actor.id) {
      throw new ForbiddenException('You can only update courses you own');
    }

    if (dto.slug && dto.slug !== course.slug) {
      const conflict = await this.repo.findBySlug(dto.slug);
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`Course with slug "${dto.slug}" already exists`);
      }
    }

    if (dto.categoryId) {
      const cat = await this.categoriesRepo.findById(dto.categoryId);
      if (!cat) throw new NotFoundException(`Category ${dto.categoryId} not found`);
    }

    if (actor.role === UserRole.INSTRUCTOR && dto.instructorId && dto.instructorId !== actor.id) {
      throw new ForbiddenException('Instructors cannot reassign course ownership');
    }

    const data: Prisma.CourseUpdateInput = {
      ...(dto.slug !== undefined && { slug: dto.slug }),
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.shortName !== undefined && { shortName: dto.shortName }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      ...(dto.level !== undefined && { level: dto.level }),
      ...(dto.badge !== undefined && { badge: dto.badge }),
      ...(dto.priceCents !== undefined && { priceCents: dto.priceCents }),
      ...(dto.originalPriceCents !== undefined && { originalPriceCents: dto.originalPriceCents }),
      ...(dto.currency !== undefined && { currency: dto.currency }),
      ...(dto.durationLabel !== undefined && { durationLabel: dto.durationLabel }),
      ...(dto.ratingAvg !== undefined && { ratingAvg: dto.ratingAvg }),
      ...(dto.ratingCount !== undefined && { ratingCount: dto.ratingCount }),
      ...(dto.enrolledLabel !== undefined && { enrolledLabel: dto.enrolledLabel }),
      ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
      ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
      ...(dto.classmateCount !== undefined && { classmateCount: dto.classmateCount }),
      ...(dto.learnings !== undefined && { learnings: dto.learnings }),
      ...(dto.tags !== undefined && { tags: dto.tags }),
      ...(dto.categoryId !== undefined && {
        category: dto.categoryId ? { connect: { id: dto.categoryId } } : { disconnect: true },
      }),
      ...(dto.instructorId !== undefined && {
        instructor: dto.instructorId ? { connect: { id: dto.instructorId } } : { disconnect: true },
      }),
    };
    return this.repo.update(id, data);
  }

  async remove(id: string, actor: ActorContext): Promise<{ id: string; deleted: true }> {
    const course = await this.repo.findById(id);
    if (!course) throw new NotFoundException(`Course ${id} not found`);
    if (actor.role === UserRole.INSTRUCTOR && course.instructorId !== actor.id) {
      throw new ForbiddenException('You can only delete courses you own');
    }
    await this.repo.softDelete(id);
    return { id, deleted: true };
  }
}
