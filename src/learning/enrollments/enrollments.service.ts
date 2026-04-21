import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Enrollment, Prisma, UserRole } from '@prisma/client';

import { CoursesRepository } from '../../catalog/courses.repository';
import {
  PaginatedResult,
  buildPaginatedResult,
} from '../../catalog/dto/pagination.dto';
import { EnrollDto } from '../dto/enroll.dto';
import { ListEnrollmentsQueryDto } from '../dto/list-enrollments.dto';
import {
  EnrollmentDetail,
  EnrollmentsRepository,
} from './enrollments.repository';

interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly repo: EnrollmentsRepository,
    private readonly coursesRepo: CoursesRepository,
  ) {}

  async list(
    query: ListEnrollmentsQueryDto,
    actor: ActorContext,
  ): Promise<PaginatedResult<EnrollmentDetail>> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.EnrollmentWhereInput = {};

    // Non-admins can only see their own enrollments.
    if (actor.role === UserRole.ADMIN) {
      if (query.userId) where.userId = query.userId;
    } else {
      where.userId = actor.id;
    }

    if (query.courseId) where.courseId = query.courseId;
    if (query.completed === true) where.completedAt = { not: null };
    if (query.completed === false) where.completedAt = null;

    const orderBy: Prisma.EnrollmentOrderByWithRelationInput = { enrolledAt: 'desc' };
    const { items, total } = await this.repo.findAll({ skip, take: pageSize, where, orderBy });
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async findById(id: string, actor: ActorContext): Promise<EnrollmentDetail> {
    const enrollment = await this.repo.findById(id);
    if (!enrollment) throw new NotFoundException(`Enrollment ${id} not found`);
    this.assertCanAccess(enrollment.userId, actor);
    return enrollment;
  }

  async enroll(dto: EnrollDto, actor: ActorContext): Promise<Enrollment> {
    const course = await this.coursesRepo.findById(dto.courseId);
    if (!course) throw new NotFoundException(`Course ${dto.courseId} not found`);
    if (!course.isPublished && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Course is not published yet');
    }

    const existing = await this.repo.findByUserAndCourse(actor.id, dto.courseId);
    if (existing) {
      throw new ConflictException(`Already enrolled in course ${dto.courseId}`);
    }

    return this.repo.create({
      user: { connect: { id: actor.id } },
      course: { connect: { id: dto.courseId } },
      lastAccessAt: new Date(),
    });
  }

  async withdraw(
    id: string,
    actor: ActorContext,
  ): Promise<{ id: string; deleted: true }> {
    const enrollment = await this.repo.findById(id);
    if (!enrollment) throw new NotFoundException(`Enrollment ${id} not found`);
    this.assertCanAccess(enrollment.userId, actor);
    await this.repo.softDelete(id);
    return { id, deleted: true };
  }

  async touchLastAccess(id: string, actor: ActorContext): Promise<Enrollment> {
    const enrollment = await this.repo.findById(id);
    if (!enrollment) throw new NotFoundException(`Enrollment ${id} not found`);
    this.assertCanAccess(enrollment.userId, actor);
    return this.repo.update(id, { lastAccessAt: new Date() });
  }

  private assertCanAccess(ownerId: string, actor: ActorContext): void {
    if (actor.role === UserRole.ADMIN) return;
    if (ownerId === actor.id) return;
    throw new ForbiddenException('You do not have access to this enrollment');
  }
}
