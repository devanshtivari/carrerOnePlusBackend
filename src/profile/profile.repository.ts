import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

const profileSelect = {
  id: true,
  email: true,
  fullName: true,
  avatarUrl: true,
  bannerUrl: true,
  initials: true,
  bio: true,
  role: true,
  isEmailVerified: true,
  isActive: true,
  authProvider: true,
  mobile: true,
  grade: true,
  schoolName: true,
  age: true,
  rollNo: true,
  instructorTitle: true,
  totalScore: true,
  rank: true,
  attendance: true,
  percentile: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
} satisfies Prisma.UserSelect;

export type ProfilePayload = Prisma.UserGetPayload<{ select: typeof profileSelect }>;

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  readonly defaultSelect = profileSelect;

  async findById(id: string): Promise<ProfilePayload | null> {
    return this.prisma.user.findUnique({ where: { id }, select: profileSelect });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async listStaff(skip: number, take: number): Promise<{ items: ProfilePayload[]; total: number }> {
    const where: Prisma.UserWhereInput = { role: { in: ['INSTRUCTOR', 'ADMIN'] }, isActive: true };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { fullName: 'asc' },
        select: profileSelect,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total };
  }

  async listStudents(
    skip: number,
    take: number,
  ): Promise<{ items: ProfilePayload[]; total: number }> {
    const where: Prisma.UserWhereInput = { role: 'STUDENT', isActive: true };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { fullName: 'asc' },
        select: profileSelect,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total };
  }
}
