import { Prisma, ReportKind } from '@prisma/client';

import { SeederContext } from './index';

interface ReportSeed {
  title: string;
  kind: ReportKind;
  iconName?: string;
  payload?: Record<string, unknown>;
}

const reportsSeedData: ReportSeed[] = [
  {
    title: 'Q1 Class Performance Summary',
    kind: ReportKind.PERFORMANCE_SUMMARY,
    iconName: 'BarChart3',
    payload: { quarter: 'Q1', generatedFor: '2026-Q1' },
  },
  {
    title: 'Monthly Attendance Trend',
    kind: ReportKind.ATTENDANCE,
    iconName: 'CalendarCheck',
    payload: { month: 'March', generatedFor: '2026-03' },
  },
  {
    title: 'Subject-wise Score Trend',
    kind: ReportKind.TREND,
    iconName: 'TrendingUp',
    payload: { months: 6 },
  },
];

export async function seedReports({ prisma }: SeederContext): Promise<void> {
  const owner = await prisma.user.findFirst({
    where: { role: 'INSTRUCTOR', isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!owner) return;

  for (const data of reportsSeedData) {
    const existing = await prisma.report.findFirst({
      where: { ownerId: owner.id, title: data.title, deletedAt: null },
    });
    const payload: Prisma.ReportUncheckedCreateInput = {
      ownerId: owner.id,
      title: data.title,
      kind: data.kind,
      iconName: data.iconName ?? null,
      payload: (data.payload ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    };
    if (existing) {
      await prisma.report.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.report.create({ data: payload });
    }
  }
}
