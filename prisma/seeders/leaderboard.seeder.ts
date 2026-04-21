import { LeaderboardScope } from '@prisma/client';

import { SCHOOL_NAME } from './data/students.data';
import { SeederContext } from './index';

/**
 * Pre-computes leaderboard snapshots for the seeded users so the frontend
 * has data to render immediately. Production builds will rely on the
 * Leaderboard recompute endpoint to refresh these.
 */
export async function seedLeaderboard({ prisma }: SeederContext): Promise<void> {
  await rebuild(prisma, LeaderboardScope.GLOBAL, null);
  await rebuild(prisma, LeaderboardScope.NATIONAL, 'IN');
  await rebuild(prisma, LeaderboardScope.SCHOOL, SCHOOL_NAME);

  const classes = await prisma.class.findMany({ select: { id: true } });
  for (const cls of classes) {
    await rebuild(prisma, LeaderboardScope.CLASS, cls.id);
  }
}

async function rebuild(
  prisma: SeederContext['prisma'],
  scope: LeaderboardScope,
  scopeKey: string | null,
): Promise<void> {
  const users = await loadUsers(prisma, scope, scopeKey);
  const sorted = [...users].sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));
  const userIds = sorted.map((u) => u.id);

  const grouped =
    userIds.length > 0
      ? await prisma.enrollment.groupBy({
          by: ['userId'],
          where: { userId: { in: userIds }, completedAt: { not: null } },
          _count: { _all: true },
        })
      : [];
  const completionMap = new Map<string, number>();
  for (const g of grouped) {
    completionMap.set(g.userId, g._count._all);
  }

  await prisma.leaderboardEntry.deleteMany({
    where: { scope, scopeKey: scopeKey ?? null },
  });
  if (sorted.length === 0) return;

  await prisma.leaderboardEntry.createMany({
    data: sorted.map((u, idx) => ({
      scope,
      scopeKey: scopeKey ?? null,
      userId: u.id,
      rank: idx + 1,
      points: u.totalScore ?? 0,
      coursesDone: completionMap.get(u.id) ?? 0,
      streakDays: 0,
    })),
    skipDuplicates: true,
  });
}

async function loadUsers(
  prisma: SeederContext['prisma'],
  scope: LeaderboardScope,
  scopeKey: string | null,
): Promise<{ id: string; totalScore: number }[]> {
  if (scope === LeaderboardScope.CLASS) {
    if (!scopeKey) return [];
    const memberships = await prisma.classMembership.findMany({
      where: { classId: scopeKey, role: 'STUDENT' },
      select: { user: { select: { id: true, totalScore: true } } },
    });
    return memberships.map((m) => m.user);
  }
  if (scope === LeaderboardScope.SCHOOL) {
    if (!scopeKey) return [];
    return prisma.user.findMany({
      where: { schoolName: scopeKey, role: 'STUDENT' },
      select: { id: true, totalScore: true },
    });
  }
  return prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: { id: true, totalScore: true },
  });
}
