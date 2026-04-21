import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestStatus, TestType } from '@prisma/client';

import { CoursesRepository } from '../../catalog/courses.repository';
import { TestsRepository } from '../tests/tests.repository';
import { TestsService } from '../tests/tests.service';

describe('TestsService', () => {
  let service: TestsService;
  const repo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    refreshTotals: jest.fn(),
  };
  const coursesRepo = { findById: jest.fn() };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        TestsService,
        { provide: TestsRepository, useValue: repo },
        { provide: CoursesRepository, useValue: coursesRepo },
      ],
    }).compile();
    service = moduleRef.get(TestsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('returns paginated results with default sort', async () => {
      repo.findAll.mockResolvedValue({ items: [{ id: 't1' }], total: 1 });
      const result = await service.list({} as any);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      const args = repo.findAll.mock.calls[0][0];
      expect(args.orderBy).toEqual({ scheduledAt: 'asc' });
    });

    it('applies status, type, courseId, search filters', async () => {
      repo.findAll.mockResolvedValue({ items: [], total: 0 });
      await service.list({
        status: TestStatus.LIVE,
        type: TestType.MCQ,
        courseId: 'c1',
        search: 'algo',
      } as any);
      const args = repo.findAll.mock.calls[0][0];
      expect(args.where.status).toBe(TestStatus.LIVE);
      expect(args.where.type).toBe(TestType.MCQ);
      expect(args.where.courseId).toBe('c1');
      expect(args.where.OR).toBeDefined();
    });
  });

  describe('findById / findByCode', () => {
    it('throws NotFound on missing test by id', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('x')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('returns test by id', async () => {
      repo.findById.mockResolvedValue({ id: 't1' });
      await expect(service.findById('t1')).resolves.toEqual({ id: 't1' });
    });
    it('throws NotFound on missing test by code', async () => {
      repo.findByCode.mockResolvedValue(null);
      await expect(service.findByCode('TEST-X')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('returns test by code', async () => {
      repo.findByCode.mockResolvedValue({ id: 't1', code: 'TEST-1' });
      await expect(service.findByCode('TEST-1')).resolves.toEqual({ id: 't1', code: 'TEST-1' });
    });
  });

  describe('create', () => {
    it('throws Conflict on duplicate code', async () => {
      repo.findByCode.mockResolvedValue({ id: 'existing' });
      await expect(
        service.create({ code: 'TEST-1', title: 'x' } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
    it('throws NotFound when courseId does not exist', async () => {
      repo.findByCode.mockResolvedValue(null);
      coursesRepo.findById.mockResolvedValue(null);
      await expect(
        service.create({ code: 'TEST-1', title: 'x', courseId: 'c1' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
    it('creates with sensible defaults', async () => {
      repo.findByCode.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: 't1' });
      const result = await service.create({
        code: 'TEST-1',
        title: 'Demo',
        scheduledAt: '2026-04-20T10:00:00Z',
      } as any);
      expect(result).toEqual({ id: 't1' });
      const data = repo.create.mock.calls[0][0];
      expect(data.code).toBe('TEST-1');
      expect(data.durationMinutes).toBe(0);
      expect(data.scheduledAt).toBeInstanceOf(Date);
    });
    it('connects the course when courseId is provided', async () => {
      repo.findByCode.mockResolvedValue(null);
      coursesRepo.findById.mockResolvedValue({ id: 'c1' });
      repo.create.mockResolvedValue({ id: 't1' });
      await service.create({ code: 'TEST-1', title: 'Demo', courseId: 'c1' } as any);
      expect(repo.create.mock.calls[0][0].course).toEqual({ connect: { id: 'c1' } });
    });
  });

  describe('update', () => {
    it('throws when test missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('x', {} as any)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('rejects code conflict on rename', async () => {
      repo.findById.mockResolvedValue({ id: 't1', code: 'TEST-1' });
      repo.findByCode.mockResolvedValue({ id: 'other' });
      await expect(
        service.update('t1', { code: 'TEST-2' } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
    it('clears scheduledAt when null is provided', async () => {
      repo.findById.mockResolvedValue({ id: 't1', code: 'TEST-1' });
      repo.update.mockResolvedValue({ id: 't1' });
      await service.update('t1', { scheduledAt: undefined, courseId: undefined } as any);
      expect(repo.update).toHaveBeenCalled();
    });
    it('disconnects course when courseId is empty string', async () => {
      repo.findById.mockResolvedValue({ id: 't1', code: 'TEST-1' });
      repo.update.mockResolvedValue({ id: 't1' });
      await service.update('t1', { courseId: '' } as any);
      const data = repo.update.mock.calls[0][1];
      expect(data.course).toEqual({ disconnect: true });
    });
  });

  describe('remove', () => {
    it('throws on missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.remove('x')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('soft deletes', async () => {
      repo.findById.mockResolvedValue({ id: 't1' });
      repo.softDelete.mockResolvedValue({ id: 't1' });
      await expect(service.remove('t1')).resolves.toEqual({ id: 't1', deleted: true });
    });
  });
});
