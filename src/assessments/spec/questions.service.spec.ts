import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QuestionType } from '@prisma/client';

import { QuestionsRepository } from '../tests/questions.repository';
import { QuestionsService } from '../tests/questions.service';
import { TestsRepository } from '../tests/tests.repository';

describe('QuestionsService', () => {
  let service: QuestionsService;
  const repo = {
    findById: jest.fn(),
    findByTest: jest.fn(),
    findByTestAndPosition: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    replaceOptions: jest.fn(),
  };
  const testsRepo = { findById: jest.fn(), refreshTotals: jest.fn() };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        { provide: QuestionsRepository, useValue: repo },
        { provide: TestsRepository, useValue: testsRepo },
      ],
    }).compile();
    service = moduleRef.get(QuestionsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('listForTest', () => {
    it('throws if test missing', async () => {
      testsRepo.findById.mockResolvedValue(null);
      await expect(service.listForTest('t1')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('returns questions for test', async () => {
      testsRepo.findById.mockResolvedValue({ id: 't1' });
      repo.findByTest.mockResolvedValue([{ id: 'q1' }]);
      await expect(service.listForTest('t1')).resolves.toEqual([{ id: 'q1' }]);
    });
  });

  describe('findById', () => {
    it('throws on missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('q1')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('returns when present', async () => {
      repo.findById.mockResolvedValue({ id: 'q1' });
      await expect(service.findById('q1')).resolves.toEqual({ id: 'q1' });
    });
  });

  describe('create', () => {
    it('throws if test missing', async () => {
      testsRepo.findById.mockResolvedValue(null);
      await expect(
        service.create('t1', { prompt: 'p' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
    it('rejects MCQ with fewer than 2 options', async () => {
      testsRepo.findById.mockResolvedValue({ id: 't1' });
      repo.findByTestAndPosition.mockResolvedValue(null);
      await expect(
        service.create('t1', {
          prompt: 'p',
          type: QuestionType.MCQ,
          options: [{ label: 'a', text: 'A' }],
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
    it('rejects duplicate position', async () => {
      testsRepo.findById.mockResolvedValue({ id: 't1' });
      repo.findByTestAndPosition.mockResolvedValue({ id: 'qx' });
      await expect(
        service.create('t1', { prompt: 'p', position: 3 } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
    it('creates an MCQ question and refreshes totals', async () => {
      testsRepo.findById.mockResolvedValue({ id: 't1' });
      repo.findByTestAndPosition.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: 'q1' });
      repo.findById.mockResolvedValue({ id: 'q1' });
      const result = await service.create('t1', {
        prompt: 'Pick one',
        marks: 5,
        type: QuestionType.MCQ,
        options: [
          { label: 'a', text: 'A', isCorrect: true },
          { label: 'b', text: 'B' },
        ],
      } as any);
      expect(result).toEqual({ id: 'q1' });
      expect(testsRepo.refreshTotals).toHaveBeenCalledWith('t1');
    });
    it('creates a TEXT question without options', async () => {
      testsRepo.findById.mockResolvedValue({ id: 't1' });
      repo.findByTestAndPosition.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: 'q1' });
      repo.findById.mockResolvedValue({ id: 'q1' });
      await service.create('t1', { prompt: 'why?', type: QuestionType.TEXT } as any);
      expect(repo.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws on missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('q1', {} as any)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('rejects position conflict', async () => {
      repo.findById.mockResolvedValue({ id: 'q1', testId: 't1', position: 1 });
      repo.findByTestAndPosition.mockResolvedValue({ id: 'qx' });
      await expect(service.update('q1', { position: 2 } as any)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
    it('updates and replaces options', async () => {
      repo.findById
        .mockResolvedValueOnce({ id: 'q1', testId: 't1', position: 1 })
        .mockResolvedValueOnce({ id: 'q1' });
      repo.findByTestAndPosition.mockResolvedValue(null);
      repo.update.mockResolvedValue({ id: 'q1' });
      await service.update('q1', {
        prompt: 'new',
        options: [{ label: 'a', text: 'A' }],
      } as any);
      expect(repo.replaceOptions).toHaveBeenCalledWith('q1', [{ label: 'a', text: 'A' }]);
      expect(testsRepo.refreshTotals).toHaveBeenCalledWith('t1');
    });
  });

  describe('remove', () => {
    it('throws on missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.remove('q1')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('removes and refreshes totals', async () => {
      repo.findById.mockResolvedValue({ id: 'q1', testId: 't1' });
      repo.softDelete.mockResolvedValue({ id: 'q1' });
      await expect(service.remove('q1')).resolves.toEqual({ id: 'q1', deleted: true });
      expect(testsRepo.refreshTotals).toHaveBeenCalledWith('t1');
    });
  });
});
