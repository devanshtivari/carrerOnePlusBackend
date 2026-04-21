import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Class,
  ClassMembership,
  ClassMembershipRole,
  Prisma,
  UserRole,
} from '@prisma/client';

import {
  PaginatedResult,
  buildPaginatedResult,
} from '../../catalog/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { AddClassMemberDto } from '../dto/add-class-member.dto';
import { CreateClassDto } from '../dto/create-class.dto';
import { ListClassesQueryDto } from '../dto/list-classes.dto';
import { UpdateClassDto } from '../dto/update-class.dto';
import {
  ClassDetail,
  ClassesRepository,
  MembershipDetail,
} from './classes.repository';

interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class ClassesService {
  constructor(
    private readonly repo: ClassesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async list(
    query: ListClassesQueryDto,
    actor: ActorContext,
  ): Promise<PaginatedResult<ClassDetail>> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.ClassWhereInput = {};

    if (actor.role !== UserRole.ADMIN) {
      where.memberships = { some: { userId: actor.id } };
    }

    if (query.grade) where.grade = query.grade;
    if (query.schoolName) where.schoolName = query.schoolName;
    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { code: { contains: term, mode: 'insensitive' } },
        { schoolName: { contains: term, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ClassOrderByWithRelationInput = { createdAt: 'desc' };
    const { items, total } = await this.repo.findAll({ skip, take: pageSize, where, orderBy });
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async findById(id: string, actor: ActorContext): Promise<ClassDetail> {
    const cls = await this.repo.findById(id);
    if (!cls) throw new NotFoundException(`Class ${id} not found`);
    await this.assertCanRead(cls.id, actor);
    return cls;
  }

  async findByCode(code: string, actor: ActorContext): Promise<ClassDetail> {
    const cls = await this.repo.findByCode(code);
    if (!cls) throw new NotFoundException(`Class ${code} not found`);
    await this.assertCanRead(cls.id, actor);
    return cls;
  }

  async create(dto: CreateClassDto): Promise<Class> {
    const existing = await this.repo.findByCode(dto.code);
    if (existing) throw new ConflictException(`Class with code "${dto.code}" already exists`);
    return this.repo.create({
      code: dto.code,
      name: dto.name,
      grade: dto.grade,
      section: dto.section,
      schoolName: dto.schoolName,
      description: dto.description,
    });
  }

  async update(id: string, dto: UpdateClassDto): Promise<Class> {
    const cls = await this.repo.findById(id);
    if (!cls) throw new NotFoundException(`Class ${id} not found`);
    if (dto.code && dto.code !== cls.code) {
      const conflict = await this.repo.findByCode(dto.code);
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`Class with code "${dto.code}" already exists`);
      }
    }
    const data: Prisma.ClassUpdateInput = {
      ...(dto.code !== undefined && { code: dto.code }),
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.grade !== undefined && { grade: dto.grade }),
      ...(dto.section !== undefined && { section: dto.section }),
      ...(dto.schoolName !== undefined && { schoolName: dto.schoolName }),
      ...(dto.description !== undefined && { description: dto.description }),
    };
    return this.repo.update(id, data);
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    const cls = await this.repo.findById(id);
    if (!cls) throw new NotFoundException(`Class ${id} not found`);
    await this.repo.softDelete(id);
    return { id, deleted: true };
  }

  async listMembers(classId: string, actor: ActorContext): Promise<MembershipDetail[]> {
    await this.assertCanRead(classId, actor);
    return this.repo.listMembers(classId);
  }

  async listMine(actor: ActorContext): Promise<MembershipDetail[]> {
    return this.repo.listMembershipsForUser(actor.id);
  }

  async addMember(
    classId: string,
    dto: AddClassMemberDto,
    actor: ActorContext,
  ): Promise<ClassMembership> {
    const cls = await this.repo.findById(classId);
    if (!cls) throw new NotFoundException(`Class ${classId} not found`);
    await this.assertCanWriteMembership(classId, actor);

    const role = dto.role ?? ClassMembershipRole.STUDENT;

    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true },
    });
    if (!targetUser) throw new NotFoundException(`User ${dto.userId} not found`);

    const existing = await this.repo.findMembership(classId, dto.userId, role);
    if (existing) {
      throw new ConflictException(
        `User already has the ${role} role in this class`,
      );
    }

    return this.repo.addMember({
      class: { connect: { id: classId } },
      user: { connect: { id: dto.userId } },
      role,
    });
  }

  async removeMember(
    membershipId: string,
    actor: ActorContext,
  ): Promise<{ id: string; deleted: true }> {
    const membership = await this.repo.findMembershipById(membershipId);
    if (!membership) throw new NotFoundException(`Membership ${membershipId} not found`);
    await this.assertCanWriteMembership(membership.classId, actor);
    await this.repo.removeMembership(membershipId);
    return { id: membershipId, deleted: true };
  }

  private async assertCanRead(classId: string, actor: ActorContext): Promise<void> {
    if (actor.role === UserRole.ADMIN) return;
    const membership = await this.prisma.classMembership.findFirst({
      where: { classId, userId: actor.id },
      select: { id: true },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this class');
    }
  }

  private async assertCanWriteMembership(
    classId: string,
    actor: ActorContext,
  ): Promise<void> {
    if (actor.role === UserRole.ADMIN) return;
    const membership = await this.prisma.classMembership.findFirst({
      where: {
        classId,
        userId: actor.id,
        role: { in: [ClassMembershipRole.TEACHER, ClassMembershipRole.ASSISTANT] },
      },
      select: { id: true },
    });
    if (!membership) {
      throw new ForbiddenException('Only admins or class teachers can manage membership');
    }
  }
}
