import { Injectable } from '@nestjs/common';
import { SubmissionStatus, UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

interface ActorContext {
  id: string;
  role: UserRole;
}

export interface StatCard {
  label: string;
  value: string;
  iconName: string;
  subText?: string | null;
  subColor?: string | null;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async studentDashboard(actor: ActorContext) {
    const [user, enrollments, upcomingTests, recentFeedback, projectsAgg, recentCompletions] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id: actor.id },
          select: {
            id: true,
            fullName: true,
            initials: true,
            totalScore: true,
            rank: true,
          },
        }),
        this.prisma.enrollment.findMany({
          where: { userId: actor.id, deletedAt: null },
          include: {
            course: {
              select: {
                id: true,
                slug: true,
                title: true,
                description: true,
                imageUrl: true,
                level: true,
              },
            },
          },
          take: 6,
        }),
        this.prisma.test.findMany({
          where: { status: { in: ['UPCOMING', 'LIVE'] }, deletedAt: null },
          orderBy: { scheduledAt: 'asc' },
          take: 5,
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
            scheduledAt: true,
            durationMinutes: true,
            type: true,
          },
        }),
        this.prisma.feedback.findMany({
          where: { studentId: actor.id, deletedAt: null },
          include: {
            instructor: {
              select: { fullName: true, initials: true, avatarUrl: true, instructorTitle: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        }),
        this.prisma.projectSubmission.groupBy({
          by: ['status'],
          where: { userId: actor.id, deletedAt: null },
          _count: true,
        }),
        this.prisma.lessonCompletion.findMany({
          where: {
            userId: actor.id,
            completedAt: { gte: daysAgo(14) },
          },
          select: { completedAt: true },
          orderBy: { completedAt: 'desc' },
        }),
      ]);

    const projectsCompleted = projectsAgg
      .filter(
        (p) => p.status === SubmissionStatus.SUBMITTED || p.status === SubmissionStatus.GRADED,
      )
      .reduce((acc, p) => acc + p._count, 0);
    const totalProjects = projectsAgg.reduce((acc, p) => acc + p._count, 0);

    const streakDays = computeStreakDays(recentCompletions.map((c) => c.completedAt));

    const stats: StatCard[] = [
      {
        label: 'Class Rank',
        value: user?.rank ? `#${user.rank}` : '—',
        iconName: 'BarChart3',
        subText: 'In your class',
        subColor: 'text-[#A1A1AA]',
      },
      {
        label: 'Day Streak',
        value: streakDays > 0 ? `${streakDays} days` : '—',
        iconName: 'Flame',
        subText: streakDays > 0 ? 'Keep it going!' : 'Start a streak today',
        subColor: streakDays > 0 ? 'text-accent-primary' : 'text-[#A1A1AA]',
      },
      {
        label: 'Total Score',
        value: (user?.totalScore ?? 0).toLocaleString(),
        iconName: 'Trophy',
        subText: 'Lifetime points',
        subColor: 'text-[#A1A1AA]',
      },
      {
        label: 'Projects',
        value: totalProjects > 0 ? `${projectsCompleted}/${totalProjects}` : '0',
        iconName: 'CheckCircle2',
        subText: totalProjects > 0 ? 'Submitted & graded' : 'None yet',
        subColor: 'text-[#A1A1AA]',
      },
    ];

    return {
      profile: {
        id: user?.id ?? actor.id,
        name: user?.fullName ?? '',
        initials: user?.initials ?? null,
        rank: user?.rank ? `#${user.rank}` : null,
        totalScore: user?.totalScore != null ? String(user.totalScore) : null,
      },
      stats,
      enrolledCourses: enrollments.map((e) => ({
        id: e.course.id,
        slug: e.course.slug,
        title: e.course.title,
        description: e.course.description,
        imageUrl: e.course.imageUrl,
        difficulty: e.course.level,
        progress: e.progress,
      })),
      upcomingAssessments: upcomingTests.map((t) => {
        const { date, time } = splitDateTime(t.scheduledAt);
        return {
          id: t.id,
          code: t.code,
          title: t.title,
          date,
          time,
          duration: `${t.durationMinutes} mins`,
          icon: t.status === 'LIVE' ? 'alert' : 'book',
          type: t.type,
        };
      }),
      recentFeedback: recentFeedback.map((f) => ({
        id: f.id,
        instructorName: f.instructor?.fullName ?? 'Instructor',
        instructorInitials: f.instructor?.initials ?? '',
        section: f.sectionLabel ?? '',
        comment: f.body,
        gradeInfo: f.gradeLabel ?? '',
      })),
    };
  }

  async teacherDashboard(actor: ActorContext) {
    const [teacher, studentCount, attendanceAvg, projectsAgg, alerts, upcomingEvents] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id: actor.id },
          select: { id: true, fullName: true, initials: true, instructorTitle: true },
        }),
        this.prisma.user.count({ where: { role: UserRole.STUDENT, isActive: true } }),
        this.prisma.user.aggregate({
          where: { role: UserRole.STUDENT, attendance: { not: null } },
          _avg: { attendance: true },
        }),
        this.prisma.projectSubmission.groupBy({
          by: ['status'],
          where: { deletedAt: null },
          _count: true,
        }),
        this.prisma.alert.findMany({
          where: { resolvedAt: null, deletedAt: null },
          orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
          take: 5,
        }),
        this.prisma.calendarEvent.findMany({
          where: { startsAt: { gte: new Date() }, deletedAt: null },
          orderBy: { startsAt: 'asc' },
          take: 5,
        }),
      ]);

    const completedProjects = projectsAgg
      .filter(
        (p) => p.status === SubmissionStatus.SUBMITTED || p.status === SubmissionStatus.GRADED,
      )
      .reduce((acc, p) => acc + p._count, 0);
    const totalProjects = projectsAgg.reduce((acc, p) => acc + p._count, 0);

    const avgPerformance = await this.prisma.subjectScore.aggregate({
      _avg: { score: true },
    });
    const avgPerformanceVal = Number((avgPerformance._avg.score ?? 0).toFixed(1));
    const attendanceRate = Number((attendanceAvg._avg.attendance ?? 0).toFixed(1));
    const projectCompletion = totalProjects
      ? Number(((completedProjects / totalProjects) * 100).toFixed(1))
      : 0;

    const stats: StatCard[] = [
      {
        label: 'Total Students',
        value: studentCount.toLocaleString(),
        iconName: 'Users',
        subText: 'Active accounts',
      },
      {
        label: 'Avg Performance',
        value: `${avgPerformanceVal}%`,
        iconName: 'TrendingUp',
        subText: 'Across all subjects',
      },
      {
        label: 'Attendance Rate',
        value: `${attendanceRate}%`,
        iconName: 'UserCheck',
        subText: 'Rolling 30 days',
      },
      {
        label: 'Project Completion',
        value: `${projectCompletion}%`,
        iconName: 'Rocket',
        subText: `${completedProjects} / ${totalProjects} submitted`,
      },
    ];

    return {
      profile: {
        id: teacher?.id ?? actor.id,
        name: teacher?.fullName ?? '',
        initials: teacher?.initials ?? null,
        title: teacher?.instructorTitle ?? null,
      },
      stats,
      alerts: alerts.map((a) => ({
        id: a.id,
        title: a.title,
        message: a.message,
        priority: a.priority,
        studentsAffected: a.studentsAffected,
        timeInfo: a.timeInfo,
      })),
      upcomingEvents: upcomingEvents.map((e) => ({
        id: e.id,
        title: e.title,
        startsAt: e.startsAt.toISOString(),
        endsAt: e.endsAt ? e.endsAt.toISOString() : null,
        location: e.location,
        type: e.type,
      })),
      recentFeedback: [],
    };
  }
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function splitDateTime(iso: Date | null): { date: string; time: string } {
  if (!iso) return { date: 'TBD', time: '' };
  const d = iso instanceof Date ? iso : new Date(iso);
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
}

function computeStreakDays(completedAts: Date[]): number {
  if (completedAts.length === 0) return 0;

  const dayKeys = new Set<string>();
  for (const ts of completedAts) {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    dayKeys.add(d.toISOString().slice(0, 10));
  }

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; i < 30; i++) {
    const key = cursor.toISOString().slice(0, 10);
    if (dayKeys.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
