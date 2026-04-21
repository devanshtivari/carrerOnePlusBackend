import { Injectable } from '@nestjs/common';
import { GrowthSnapshot, Prisma, SubjectScore } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResultsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listSubjectScores(userId: string): Promise<SubjectScore[]> {
    return this.prisma.subjectScore.findMany({
      where: { userId },
      orderBy: { score: 'desc' },
    });
  }

  async upsertSubjectScore(
    userId: string,
    data: Prisma.SubjectScoreUncheckedCreateInput,
  ): Promise<SubjectScore> {
    return this.prisma.subjectScore.upsert({
      where: { userId_subjectLabel: { userId, subjectLabel: data.subjectLabel } },
      create: { ...data, userId },
      update: {
        score: data.score,
        maxScore: data.maxScore,
        gradeLabel: data.gradeLabel ?? null,
        trend: data.trend,
        trendValue: data.trendValue ?? null,
        recordedAt: new Date(),
      },
    });
  }

  async listGrowthSnapshots(userId: string): Promise<GrowthSnapshot[]> {
    return this.prisma.growthSnapshot.findMany({
      where: { userId },
      orderBy: { monthKey: 'asc' },
    });
  }

  async upsertGrowthSnapshot(
    userId: string,
    data: Prisma.GrowthSnapshotUncheckedCreateInput,
  ): Promise<GrowthSnapshot> {
    return this.prisma.growthSnapshot.upsert({
      where: { userId_monthKey: { userId, monthKey: data.monthKey } },
      create: { ...data, userId },
      update: { monthLabel: data.monthLabel, score: data.score, recordedAt: new Date() },
    });
  }
}
