import { Injectable } from '@nestjs/common';
import { Class, ClassMembership, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

const classSelect = {
  id: true,
  code: true,
  name: true,
  grade: true,
  section: true,
  schoolName: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClassSelect;

const membershipSelect = {
  id: true,
  classId: true,
  userId: true,
  role: true,
  joinedAt: true,
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      avatarUrl: true,
      initials: true,
      role: true,
    },
  },
  /**
   * The class payload gives the frontend enough context to resolve
   * grade / section / school without a second round-trip — used by the
   * class-scoped course catalogue and leaderboard scope key lookup.
   */
  class: {
    select: {
      id: true,
      code: true,
      name: true,
      grade: true,
      section: true,
      schoolName: true,
    },
  },
} satisfies Prisma.ClassMembershipSelect;

export type ClassDetail = Prisma.ClassGetPayload<{ select: typeof classSelect }>;
export type MembershipDetail = Prisma.ClassMembershipGetPayload<{
  select: typeof membershipSelect;
}>;

export interface FindAllClassesArgs {
  skip: number;
  take: number;
  where: Prisma.ClassWhereInput;
  orderBy: Prisma.ClassOrderByWithRelationInput;
}

@Injectable()
export class ClassesRepository {
  constructor(private readonly prisma: PrismaService) {}

  readonly defaultSelect = classSelect;
  readonly defaultMembershipSelect = membershipSelect;

  async create(data: Prisma.ClassCreateInput): Promise<Class> {
    return this.prisma.class.create({ data });
  }

  async findAll({
    skip,
    take,
    where,
    orderBy,
  }: FindAllClassesArgs): Promise<{ items: ClassDetail[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.class.findMany({ where, orderBy, skip, take, select: classSelect }),
      this.prisma.class.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<ClassDetail | null> {
    return this.prisma.class.findUnique({ where: { id }, select: classSelect });
  }

  async findByCode(code: string): Promise<ClassDetail | null> {
    return this.prisma.class.findUnique({ where: { code }, select: classSelect });
  }

  async update(id: string, data: Prisma.ClassUpdateInput): Promise<Class> {
    return this.prisma.class.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Class> {
    return this.prisma.class.delete({ where: { id } });
  }

  async listMembers(classId: string): Promise<MembershipDetail[]> {
    return this.prisma.classMembership.findMany({
      where: { classId },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
      select: membershipSelect,
    });
  }

  async listMembershipsForUser(userId: string): Promise<MembershipDetail[]> {
    return this.prisma.classMembership.findMany({
      where: { userId },
      orderBy: { joinedAt: 'desc' },
      select: membershipSelect,
    });
  }

  async findMembership(
    classId: string,
    userId: string,
    role: Prisma.ClassMembershipWhereInput['role'],
  ): Promise<ClassMembership | null> {
    return this.prisma.classMembership.findFirst({
      where: { classId, userId, role: role as any },
    });
  }

  async addMember(
    data: Prisma.ClassMembershipCreateInput,
  ): Promise<ClassMembership> {
    return this.prisma.classMembership.create({ data });
  }

  async removeMembership(id: string): Promise<ClassMembership> {
    return this.prisma.classMembership.delete({ where: { id } });
  }

  async findMembershipById(id: string): Promise<ClassMembership | null> {
    return this.prisma.classMembership.findUnique({ where: { id } });
  }
}
