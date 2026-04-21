import { ForbiddenException, Injectable } from '@nestjs/common';
import { TrendDirection, UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UpsertGrowthDto, UpsertSubjectScoreDto } from './dto/results.dto';
import { ResultsRepository } from './results.repository';

interface ActorContext {
  id: string;
  role: UserRole;
}

export interface ResultsSummary {
  stats: {
    overallGpa: number;
    testsTaken: number;
    testsThisMonth: number;
    assignmentsDone: number;
    assignmentsPending: number;
    projectsCompleted: number;
    projectsTotal: number;
  };
  subjectScores: Array<{
    id: string;
    subject: string;
    grade: string | null;
    score: number;
    maxScore: number;
    trend: TrendDirection;
    trendValue: string | null;
  }>;
  recentTests: Array<{
    id: string;
    title: string;
    subject: string;
    date: string;
    score: number;
    maxScore: number;
    type: string;
    status: string;
  }>;
  growthTimeline: Array<{ month: string; score: number }>;
  assignments: Array<{
    id: string;
    title: string;
    subject: string;
    submittedDate: string | null;
    grade: string | null;
    feedback: string | null;
  }>;
}

@Injectable()
export class ResultsService {
  constructor(
    private readonly repo: ResultsRepository,
    private readonly prisma: PrismaService,
  ) {}

  private assertCanRead(targetUserId: string, actor: ActorContext) {
    if (actor.role === UserRole.STUDENT && actor.id !== targetUserId) {
      throw new ForbiddenException('You can only view your own results');
    }
  }

  async upsertSubjectScore(targetUserId: string, dto: UpsertSubjectScoreDto, actor: ActorContext) {
    if (actor.role === UserRole.STUDENT) {
      throw new ForbiddenException('Only staff can write subject scores');
    }
    return this.repo.upsertSubjectScore(targetUserId, {
      userId: targetUserId,
      subjectLabel: dto.subjectLabel,
      score: dto.score,
      maxScore: dto.maxScore ?? 100,
      gradeLabel: dto.gradeLabel ?? null,
      trend: dto.trend ?? TrendDirection.STABLE,
      trendValue: dto.trendValue ?? null,
    });
  }

  async upsertGrowth(targetUserId: string, dto: UpsertGrowthDto, actor: ActorContext) {
    if (actor.role === UserRole.STUDENT) {
      throw new ForbiddenException('Only staff can write growth snapshots');
    }
    return this.repo.upsertGrowthSnapshot(targetUserId, {
      userId: targetUserId,
      monthKey: dto.monthKey,
      monthLabel: dto.monthLabel,
      score: dto.score,
    });
  }

  async getSummary(targetUserId: string, actor: ActorContext): Promise<ResultsSummary> {
    this.assertCanRead(targetUserId, actor);

    const [subjectScores, growth, attempts, submissions] = await Promise.all([
      this.repo.listSubjectScores(targetUserId),
      this.repo.listGrowthSnapshots(targetUserId),
      this.prisma.testAttempt.findMany({
        where: { userId: targetUserId },
        include: { test: { select: { title: true, type: true, courseLabel: true } } },
        orderBy: { startedAt: 'desc' },
        take: 25,
      }),
      this.prisma.assignmentSubmission.findMany({
        where: { userId: targetUserId },
        include: {
          assignment: { select: { title: true, course: { select: { title: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
    ]);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const testsThisMonth = attempts.filter(
      (a) => a.startedAt && a.startedAt >= startOfMonth,
    ).length;

    const completedAssignments = submissions.filter(
      (s) => s.status === 'SUBMITTED' || s.status === 'GRADED',
    );

    const projectsAgg = await this.prisma.projectSubmission.groupBy({
      by: ['status'],
      where: { userId: targetUserId },
      _count: true,
    });
    const projectsCompleted = projectsAgg
      .filter((p) => p.status === 'SUBMITTED' || p.status === 'GRADED')
      .reduce((acc, row) => acc + row._count, 0);
    const projectsTotal = projectsAgg.reduce((acc, row) => acc + row._count, 0);

    const overallGpa = subjectScores.length
      ? Number(
          (
            (subjectScores.reduce((acc, s) => acc + s.score / Math.max(1, s.maxScore), 0) /
              subjectScores.length) *
            4
          ).toFixed(2),
        )
      : 0;

    return {
      stats: {
        overallGpa,
        testsTaken: attempts.length,
        testsThisMonth,
        assignmentsDone: completedAssignments.length,
        assignmentsPending: submissions.length - completedAssignments.length,
        projectsCompleted,
        projectsTotal,
      },
      subjectScores: subjectScores.map((s) => ({
        id: s.id,
        subject: s.subjectLabel,
        grade: s.gradeLabel,
        score: s.score,
        maxScore: s.maxScore,
        trend: s.trend,
        trendValue: s.trendValue,
      })),
      recentTests: attempts.map((a) => ({
        id: a.id,
        title: a.test.title,
        subject: a.test.courseLabel ?? '',
        date: (a.startedAt ?? a.createdAt).toISOString(),
        score: a.score ?? 0,
        maxScore: a.maxScore ?? 0,
        type: a.test.type,
        status: a.status,
      })),
      growthTimeline: growth.map((g) => ({ month: g.monthLabel, score: g.score })),
      assignments: submissions.map((s) => ({
        id: s.id,
        title: s.assignment.title,
        subject: s.assignment.course?.title ?? '',
        submittedDate: s.submittedAt ? s.submittedAt.toISOString() : null,
        grade: s.gradeLabel,
        feedback: s.feedback,
      })),
    };
  }
}
