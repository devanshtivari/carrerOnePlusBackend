import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TrendDirection, UserRole } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ResultsRepository } from '../results.repository';
import { ResultsService } from '../results.service';

describe('ResultsService', () => {
  let service: ResultsService;
  const repo = {
    listSubjectScores: jest.fn(),
    upsertSubjectScore: jest.fn(),
    listGrowthSnapshots: jest.fn(),
    upsertGrowthSnapshot: jest.fn(),
  };
  const prisma = {
    testAttempt: { findMany: jest.fn() },
    assignmentSubmission: { findMany: jest.fn() },
    projectSubmission: { groupBy: jest.fn() },
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ResultsService,
        { provide: ResultsRepository, useValue: repo },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(ResultsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('upsertSubjectScore', () => {
    it('forbids students', async () => {
      await expect(
        service.upsertSubjectScore(
          'me',
          { subjectLabel: 'Math', score: 90 },
          { id: 'me', role: UserRole.STUDENT },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('upserts with defaults', async () => {
      repo.upsertSubjectScore.mockResolvedValue({});
      await service.upsertSubjectScore(
        'u1',
        { subjectLabel: 'Math', score: 90 },
        { id: 'instr', role: UserRole.INSTRUCTOR },
      );
      expect(repo.upsertSubjectScore).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({
          maxScore: 100,
          trend: TrendDirection.STABLE,
        }),
      );
    });
  });

  describe('upsertGrowth', () => {
    it('forbids students', async () => {
      await expect(
        service.upsertGrowth(
          'me',
          { monthKey: '2026-01', monthLabel: 'Jan', score: 70 },
          { id: 'me', role: UserRole.STUDENT },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('upserts for instructor', async () => {
      repo.upsertGrowthSnapshot.mockResolvedValue({});
      await service.upsertGrowth(
        'u1',
        { monthKey: '2026-01', monthLabel: 'Jan', score: 70 },
        { id: 'instr', role: UserRole.INSTRUCTOR },
      );
      expect(repo.upsertGrowthSnapshot).toHaveBeenCalled();
    });
  });

  describe('getSummary', () => {
    it('forbids students reading other users', async () => {
      await expect(
        service.getSummary('other', { id: 'me', role: UserRole.STUDENT }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('aggregates and returns shape expected by frontend', async () => {
      repo.listSubjectScores.mockResolvedValue([
        {
          id: 's1',
          subjectLabel: 'Math',
          score: 80,
          maxScore: 100,
          gradeLabel: 'A',
          trend: TrendDirection.UP,
          trendValue: '+2',
        },
      ]);
      repo.listGrowthSnapshots.mockResolvedValue([
        { monthLabel: 'Jan', score: 70 },
      ]);
      prisma.testAttempt.findMany.mockResolvedValue([
        {
          id: 'a1',
          test: { title: 'T', type: 'MCQ', courseLabel: 'CS' },
          startedAt: new Date(),
          createdAt: new Date(),
          score: 9,
          maxScore: 10,
          status: 'GRADED',
        },
      ]);
      prisma.assignmentSubmission.findMany.mockResolvedValue([
        {
          id: 'as1',
          status: 'SUBMITTED',
          submittedAt: new Date(),
          gradeLabel: 'B',
          feedback: 'ok',
          assignment: { title: 'Asg', course: { title: 'CS' } },
        },
      ]);
      prisma.projectSubmission.groupBy.mockResolvedValue([
        { status: 'SUBMITTED', _count: 2 },
        { status: 'NOT_SUBMITTED', _count: 1 },
      ]);

      const summary = await service.getSummary('me', {
        id: 'me',
        role: UserRole.STUDENT,
      });
      expect(summary.subjectScores).toHaveLength(1);
      expect(summary.recentTests).toHaveLength(1);
      expect(summary.assignments).toHaveLength(1);
      expect(summary.growthTimeline).toEqual([{ month: 'Jan', score: 70 }]);
      expect(summary.stats.assignmentsDone).toBe(1);
      expect(summary.stats.projectsCompleted).toBe(2);
      expect(summary.stats.projectsTotal).toBe(3);
    });
  });
});
