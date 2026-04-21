import { Injectable } from '@nestjs/common';
import { LeaderboardEntry, LeaderboardScope, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

const entrySelect = {
  id: true,
  scope: true,
  scopeKey: true,
  userId: true,
  rank: true,
  points: true,
  coursesDone: true,
  streakDays: true,
  computedAt: true,
  user: {
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      initials: true,
    },
  },
} satisfies Prisma.LeaderboardEntrySelect;

export type LeaderboardEntryDetail = Prisma.LeaderboardEntryGetPayload<{
  select: typeof entrySelect;
}>;

@Injectable()
export class LeaderboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  readonly defaultSelect = entrySelect;

  async listScoped(
    scope: LeaderboardScope,
    scopeKey: string | null,
    limit: number,
  ): Promise<LeaderboardEntryDetail[]> {
    return this.prisma.leaderboardEntry.findMany({
      where: { scope, scopeKey: scopeKey ?? null },
      orderBy: { rank: 'asc' },
      take: limit,
      select: entrySelect,
    });
  }

  async findUserEntry(
    scope: LeaderboardScope,
    scopeKey: string | null,
    userId: string,
  ): Promise<LeaderboardEntryDetail | null> {
    return this.prisma.leaderboardEntry.findFirst({
      where: { scope, scopeKey: scopeKey ?? null, userId },
      select: entrySelect,
    });
  }

  async replaceScope(
    scope: LeaderboardScope,
    scopeKey: string | null,
    entries: Prisma.LeaderboardEntryUncheckedCreateInput[],
  ): Promise<number> {
    await this.prisma.leaderboardEntry.deleteMany({
      where: { scope, scopeKey: scopeKey ?? null },
    });
    if (entries.length === 0) return 0;
    const result = await this.prisma.leaderboardEntry.createMany({
      data: entries,
      skipDuplicates: true,
    });
    return result.count;
  }

  async deleteScope(scope: LeaderboardScope, scopeKey: string | null): Promise<void> {
    await this.prisma.leaderboardEntry.deleteMany({
      where: { scope, scopeKey: scopeKey ?? null },
    });
  }

  async listUsersForScope(
    scope: LeaderboardScope,
    scopeKey: string | null,
  ): Promise<{ id: string; totalScore: number }[]> {
    if (scope === LeaderboardScope.CLASS) {
      if (!scopeKey) return [];
      const memberships = await this.prisma.classMembership.findMany({
        where: { classId: scopeKey, role: 'STUDENT' },
        select: { user: { select: { id: true, totalScore: true } } },
      });
      return memberships.map((m) => m.user);
    }

    if (scope === LeaderboardScope.SCHOOL) {
      if (!scopeKey) return [];
      return this.prisma.user.findMany({
        where: { schoolName: scopeKey, role: 'STUDENT' },
        select: { id: true, totalScore: true },
      });
    }

    // NATIONAL / GLOBAL: all students
    return this.prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, totalScore: true },
    });
  }

  async getAggregatesForUsers(
    userIds: string[],
  ): Promise<Map<string, { coursesDone: number }>> {
    if (userIds.length === 0) return new Map();
    const grouped = await this.prisma.enrollment.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, completedAt: { not: null } },
      _count: { _all: true },
    });
    const map = new Map<string, { coursesDone: number }>();
    for (const row of grouped) {
      map.set(row.userId, { coursesDone: row._count._all });
    }
    return map;
  }
}
