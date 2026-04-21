import { TrendDirection } from '@prisma/client';

import { SeederContext } from './index';

const subjectScoreSeed = [
  { subjectLabel: 'Data Structures & Algorithms', score: 96, gradeLabel: 'A+', trend: TrendDirection.UP, trendValue: '+4' },
  { subjectLabel: 'Python Fundamentals', score: 91, gradeLabel: 'A', trend: TrendDirection.UP, trendValue: '+6' },
  { subjectLabel: 'Web Development (HTML/CSS)', score: 88, gradeLabel: 'A', trend: TrendDirection.STABLE, trendValue: '0' },
  { subjectLabel: 'AI & Robotics Basics', score: 82, gradeLabel: 'B+', trend: TrendDirection.UP, trendValue: '+8' },
  { subjectLabel: 'Database Management', score: 76, gradeLabel: 'B', trend: TrendDirection.DOWN, trendValue: '-3' },
  { subjectLabel: 'Mathematics for CS', score: 85, gradeLabel: 'A-', trend: TrendDirection.UP, trendValue: '+2' },
];

const growthSeed = [
  { monthKey: '2025-09', monthLabel: 'Sep', score: 68 },
  { monthKey: '2025-10', monthLabel: 'Oct', score: 72 },
  { monthKey: '2025-11', monthLabel: 'Nov', score: 74 },
  { monthKey: '2025-12', monthLabel: 'Dec', score: 78 },
  { monthKey: '2026-01', monthLabel: 'Jan', score: 83 },
  { monthKey: '2026-02', monthLabel: 'Feb', score: 86 },
  { monthKey: '2026-03', monthLabel: 'Mar', score: 88 },
];

export async function seedResults({ prisma }: SeederContext): Promise<void> {
  const target = await prisma.user.findUnique({
    where: { email: 'alex.johnson@careerone.dev' },
  });
  if (!target) return;

  for (const s of subjectScoreSeed) {
    await prisma.subjectScore.upsert({
      where: { userId_subjectLabel: { userId: target.id, subjectLabel: s.subjectLabel } },
      update: {
        score: s.score,
        maxScore: 100,
        gradeLabel: s.gradeLabel,
        trend: s.trend,
        trendValue: s.trendValue,
        recordedAt: new Date(),
      },
      create: {
        userId: target.id,
        subjectLabel: s.subjectLabel,
        score: s.score,
        maxScore: 100,
        gradeLabel: s.gradeLabel,
        trend: s.trend,
        trendValue: s.trendValue,
      },
    });
  }

  for (const g of growthSeed) {
    await prisma.growthSnapshot.upsert({
      where: { userId_monthKey: { userId: target.id, monthKey: g.monthKey } },
      update: { monthLabel: g.monthLabel, score: g.score, recordedAt: new Date() },
      create: { userId: target.id, monthKey: g.monthKey, monthLabel: g.monthLabel, score: g.score },
    });
  }
}
