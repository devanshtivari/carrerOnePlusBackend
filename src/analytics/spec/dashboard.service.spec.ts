import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { DashboardService } from '../dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  const prisma = {
    user: { findUnique: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
    enrollment: { findMany: jest.fn() },
    test: { findMany: jest.fn() },
    feedback: { findMany: jest.fn() },
    projectSubmission: { groupBy: jest.fn() },
    lessonCompletion: { findMany: jest.fn() },
    alert: { findMany: jest.fn() },
    calendarEvent: { findMany: jest.fn() },
    subjectScore: { aggregate: jest.fn() },
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [DashboardService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(DashboardService);
  });

  afterEach(() => jest.clearAllMocks());

  it('builds student dashboard payload', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      fullName: 'Alex',
      initials: 'AJ',
      totalScore: 1250,
      rank: 5,
    });
    prisma.enrollment.findMany.mockResolvedValue([
      {
        progress: 75,
        course: {
          id: 'c1',
          slug: 'web-dev',
          title: 'Web Dev',
          description: 'd',
          imageUrl: 'i',
          level: 'ADVANCED',
        },
      },
    ]);
    prisma.test.findMany.mockResolvedValue([
      {
        id: 't1',
        code: 'TEST',
        title: 'Test',
        status: 'UPCOMING',
        scheduledAt: new Date(),
        durationMinutes: 60,
        type: 'MCQ',
      },
    ]);
    prisma.feedback.findMany.mockResolvedValue([
      {
        id: 'f1',
        sectionLabel: 'Web',
        body: 'great',
        gradeLabel: 'A+',
        instructor: {
          fullName: 'Sarah',
          initials: 'SM',
          avatarUrl: null,
          instructorTitle: 'Dr.',
        },
      },
    ]);
    prisma.projectSubmission.groupBy.mockResolvedValue([
      { status: 'SUBMITTED', _count: 4 },
      { status: 'NOT_SUBMITTED', _count: 1 },
    ]);
    prisma.lessonCompletion.findMany.mockResolvedValue([]);

    const dash = await service.studentDashboard({ id: 'u1', role: UserRole.STUDENT });
    expect(dash.profile.name).toBe('Alex');
    expect(dash.profile.rank).toBe('#5');
    expect(dash.enrolledCourses).toHaveLength(1);
    expect(dash.upcomingAssessments).toHaveLength(1);
    expect(dash.upcomingAssessments[0]).toHaveProperty('time');
    expect(dash.upcomingAssessments[0]).toHaveProperty('icon');
    expect(dash.recentFeedback).toHaveLength(1);

    expect(Array.isArray(dash.stats)).toBe(true);
    expect(dash.stats).toHaveLength(4);
    const projectStat = dash.stats.find((s) => s.label === 'Projects');
    expect(projectStat?.value).toBe('4/5');
    const rankStat = dash.stats.find((s) => s.label === 'Class Rank');
    expect(rankStat?.value).toBe('#5');
  });

  it('builds teacher dashboard payload', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'admin',
      fullName: 'Admin',
      initials: 'AD',
      instructorTitle: 'Principal',
    });
    prisma.user.count.mockResolvedValue(120);
    prisma.user.aggregate.mockResolvedValue({ _avg: { attendance: 96.4 } });
    prisma.projectSubmission.groupBy.mockResolvedValue([
      { status: 'SUBMITTED', _count: 8 },
      { status: 'GRADED', _count: 2 },
      { status: 'NOT_SUBMITTED', _count: 2 },
    ]);
    prisma.alert.findMany.mockResolvedValue([
      { id: 'a1', title: 't', message: 'm', priority: 'HIGH', studentsAffected: 3, timeInfo: null },
    ]);
    prisma.calendarEvent.findMany.mockResolvedValue([
      {
        id: 'e1',
        title: 'Sci Fair',
        startsAt: new Date('2026-12-31T09:00:00Z'),
        endsAt: null,
        location: 'Hall',
        type: 'EVENT',
      },
    ]);
    prisma.subjectScore.aggregate.mockResolvedValue({ _avg: { score: 84.5 } });

    const dash = await service.teacherDashboard({ id: 'admin', role: UserRole.ADMIN });
    expect(Array.isArray(dash.stats)).toBe(true);
    expect(dash.stats).toHaveLength(4);
    expect(dash.stats.find((s) => s.label === 'Total Students')?.value).toBe('120');
    expect(dash.stats.find((s) => s.label === 'Attendance Rate')?.value).toBe('96.4%');
    expect(dash.stats.find((s) => s.label === 'Avg Performance')?.value).toBe('84.5%');
    expect(dash.stats.find((s) => s.label === 'Project Completion')?.value).toBe('83.3%');
    expect(dash.alerts).toHaveLength(1);
    expect(dash.upcomingEvents).toHaveLength(1);
  });
});
