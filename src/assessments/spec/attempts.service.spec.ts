import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AttemptStatus, QuestionType, TestStatus, UserRole } from '@prisma/client';

import { AttemptsRepository } from '../tests/attempts.repository';
import { AttemptsService } from '../tests/attempts.service';
import { QuestionsRepository } from '../tests/questions.repository';
import { TestsRepository } from '../tests/tests.repository';

describe('AttemptsService', () => {
  let service: AttemptsService;
  const repo = {
    create: jest.fn(),
    findById: jest.fn(),
    findActiveForUser: jest.fn(),
    listForUser: jest.fn(),
    listForTest: jest.fn(),
    update: jest.fn(),
    upsertAnswer: jest.fn(),
    deleteForAttempt: jest.fn(),
  };
  const testsRepo = { findById: jest.fn() };
  const questionsRepo = { findById: jest.fn(), findByTest: jest.fn() };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AttemptsService,
        { provide: AttemptsRepository, useValue: repo },
        { provide: TestsRepository, useValue: testsRepo },
        { provide: QuestionsRepository, useValue: questionsRepo },
      ],
    }).compile();
    service = moduleRef.get(AttemptsService);
  });

  afterEach(() => jest.clearAllMocks());

  const STUDENT = { id: 'u1', role: UserRole.STUDENT };
  const ADMIN = { id: 'admin', role: UserRole.ADMIN };

  describe('start', () => {
    it('throws if test missing', async () => {
      testsRepo.findById.mockResolvedValue(null);
      await expect(service.start('t1', STUDENT)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('rejects archived tests', async () => {
      testsRepo.findById.mockResolvedValue({ id: 't1', status: TestStatus.ARCHIVED });
      await expect(service.start('t1', STUDENT)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('returns existing in-progress attempt if present', async () => {
      testsRepo.findById.mockResolvedValue({ id: 't1', status: TestStatus.LIVE, totalMarks: 50 });
      repo.findActiveForUser.mockResolvedValue({ id: 'a1' });
      await expect(service.start('t1', STUDENT)).resolves.toEqual({ id: 'a1' });
      expect(repo.create).not.toHaveBeenCalled();
    });
    it('creates a new attempt', async () => {
      testsRepo.findById.mockResolvedValue({ id: 't1', status: TestStatus.LIVE, totalMarks: 50 });
      repo.findActiveForUser.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: 'a1' });
      repo.findById.mockResolvedValue({ id: 'a1' });
      await expect(service.start('t1', STUDENT)).resolves.toEqual({ id: 'a1' });
      expect(repo.create).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('throws on missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('a1', STUDENT)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('blocks non-owner students', async () => {
      repo.findById.mockResolvedValue({ id: 'a1', userId: 'someone' });
      await expect(service.findById('a1', STUDENT)).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('allows owner', async () => {
      repo.findById.mockResolvedValue({ id: 'a1', userId: 'u1' });
      await expect(service.findById('a1', STUDENT)).resolves.toEqual({ id: 'a1', userId: 'u1' });
    });
    it('allows admin to view any', async () => {
      repo.findById.mockResolvedValue({ id: 'a1', userId: 'someone' });
      await expect(service.findById('a1', ADMIN)).resolves.toBeTruthy();
    });
  });

  describe('listForTest', () => {
    it('returns only own attempts for students', async () => {
      testsRepo.findById.mockResolvedValue({ id: 't1' });
      repo.listForUser.mockResolvedValue([{ id: 'a1' }]);
      await service.listForTest('t1', STUDENT);
      expect(repo.listForUser).toHaveBeenCalledWith('u1', { testId: 't1' });
    });
    it('returns all attempts for admin', async () => {
      testsRepo.findById.mockResolvedValue({ id: 't1' });
      repo.listForTest.mockResolvedValue([{ id: 'a1' }]);
      await service.listForTest('t1', ADMIN);
      expect(repo.listForTest).toHaveBeenCalledWith('t1');
    });
    it('throws when test missing', async () => {
      testsRepo.findById.mockResolvedValue(null);
      await expect(service.listForTest('t1', ADMIN)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('listMine', () => {
    it('lists own attempts', async () => {
      repo.listForUser.mockResolvedValue([{ id: 'a1' }]);
      await expect(service.listMine(STUDENT)).resolves.toEqual([{ id: 'a1' }]);
    });
  });

  describe('saveAnswer', () => {
    it('throws if attempt missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.saveAnswer('a1', { questionId: 'q1' } as any, STUDENT),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
    it('blocks non-owners', async () => {
      repo.findById.mockResolvedValue({
        id: 'a1',
        userId: 'someone',
        status: AttemptStatus.IN_PROGRESS,
      });
      await expect(
        service.saveAnswer('a1', { questionId: 'q1' } as any, STUDENT),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('blocks if attempt is already submitted', async () => {
      repo.findById.mockResolvedValue({
        id: 'a1',
        userId: 'u1',
        status: AttemptStatus.SUBMITTED,
      });
      await expect(
        service.saveAnswer('a1', { questionId: 'q1' } as any, STUDENT),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
    it('rejects question from another test', async () => {
      repo.findById.mockResolvedValue({
        id: 'a1',
        userId: 'u1',
        testId: 't1',
        status: AttemptStatus.IN_PROGRESS,
      });
      questionsRepo.findById.mockResolvedValue({ id: 'q1', testId: 't2' });
      await expect(
        service.saveAnswer('a1', { questionId: 'q1' } as any, STUDENT),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
    it('upserts the answer for valid input', async () => {
      repo.findById
        .mockResolvedValueOnce({
          id: 'a1',
          userId: 'u1',
          testId: 't1',
          status: AttemptStatus.IN_PROGRESS,
        })
        .mockResolvedValueOnce({ id: 'a1', answers: [] });
      questionsRepo.findById.mockResolvedValue({ id: 'q1', testId: 't1' });
      await service.saveAnswer(
        'a1',
        { questionId: 'q1', selectedLabel: 'a' } as any,
        STUDENT,
      );
      expect(repo.upsertAnswer).toHaveBeenCalled();
    });
  });

  describe('submit', () => {
    it('throws if attempt missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.submit('a1', {} as any, STUDENT)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
    it('blocks if not in progress', async () => {
      repo.findById.mockResolvedValue({
        id: 'a1',
        userId: 'u1',
        testId: 't1',
        status: AttemptStatus.SUBMITTED,
      });
      await expect(service.submit('a1', {} as any, STUDENT)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
    it('rejects answers for foreign questions', async () => {
      repo.findById.mockResolvedValue({
        id: 'a1',
        userId: 'u1',
        testId: 't1',
        status: AttemptStatus.IN_PROGRESS,
      });
      questionsRepo.findByTest.mockResolvedValue([
        { id: 'q1', type: QuestionType.MCQ, marks: 5, options: [] },
      ]);
      await expect(
        service.submit(
          'a1',
          { answers: [{ questionId: 'q-foreign', selectedLabel: 'a' }] } as any,
          STUDENT,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
    it('auto-grades MCQ answers and marks attempt GRADED', async () => {
      repo.findById
        .mockResolvedValueOnce({
          id: 'a1',
          userId: 'u1',
          testId: 't1',
          status: AttemptStatus.IN_PROGRESS,
        })
        .mockResolvedValueOnce({
          id: 'a1',
          answers: [{ questionId: 'q1', awardedMarks: 5 }],
        })
        .mockResolvedValueOnce({ id: 'a1', status: AttemptStatus.GRADED, score: 5 });
      questionsRepo.findByTest.mockResolvedValue([
        {
          id: 'q1',
          type: QuestionType.MCQ,
          marks: 5,
          options: [{ label: 'a', isCorrect: true }],
        },
      ]);
      const result = await service.submit(
        'a1',
        { answers: [{ questionId: 'q1', selectedLabel: 'a' }] } as any,
        STUDENT,
      );
      const update = repo.update.mock.calls[0][1];
      expect(update.status).toBe(AttemptStatus.GRADED);
      expect(update.score).toBe(5);
      expect(result.id).toBe('a1');
    });
    it('marks attempt SUBMITTED when text questions are present', async () => {
      repo.findById
        .mockResolvedValueOnce({
          id: 'a1',
          userId: 'u1',
          testId: 't1',
          status: AttemptStatus.IN_PROGRESS,
        })
        .mockResolvedValueOnce({ id: 'a1', answers: [] })
        .mockResolvedValueOnce({ id: 'a1', status: AttemptStatus.SUBMITTED });
      questionsRepo.findByTest.mockResolvedValue([
        { id: 'q1', type: QuestionType.TEXT, marks: 5, options: [] },
      ]);
      await service.submit('a1', { answers: [] } as any, STUDENT);
      const update = repo.update.mock.calls[0][1];
      expect(update.status).toBe(AttemptStatus.SUBMITTED);
      expect(update.score).toBeUndefined();
    });
  });
});
