import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';

import { CoursesRepository } from '../../catalog/courses.repository';
import { EnrollmentsRepository } from '../enrollments/enrollments.repository';
import { EnrollmentsService } from '../enrollments/enrollments.service';

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;
  const repo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByUserAndCourse: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };
  const coursesRepo = { findById: jest.fn() };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        { provide: EnrollmentsRepository, useValue: repo },
        { provide: CoursesRepository, useValue: coursesRepo },
      ],
    }).compile();
    service = moduleRef.get(EnrollmentsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('forces userId filter for non-admin', async () => {
      repo.findAll.mockResolvedValue({ items: [], total: 0 });
      await service.list({} as any, { id: 'me', role: UserRole.STUDENT });
      const args = repo.findAll.mock.calls[0][0];
      expect(args.where.userId).toBe('me');
    });
    it('respects userId filter for admin', async () => {
      repo.findAll.mockResolvedValue({ items: [], total: 0 });
      await service.list({ userId: 'someone' } as any, { id: 'admin', role: UserRole.ADMIN });
      const args = repo.findAll.mock.calls[0][0];
      expect(args.where.userId).toBe('someone');
    });
    it('passes completed=true → completedAt not null', async () => {
      repo.findAll.mockResolvedValue({ items: [], total: 0 });
      await service.list({ completed: true } as any, { id: 'admin', role: UserRole.ADMIN });
      const args = repo.findAll.mock.calls[0][0];
      expect(args.where.completedAt).toEqual({ not: null });
    });
    it('passes completed=false → completedAt null', async () => {
      repo.findAll.mockResolvedValue({ items: [], total: 0 });
      await service.list({ completed: false } as any, { id: 'admin', role: UserRole.ADMIN });
      expect(repo.findAll.mock.calls[0][0].where.completedAt).toBeNull();
    });
  });

  describe('enroll', () => {
    it('throws if course missing', async () => {
      coursesRepo.findById.mockResolvedValue(null);
      await expect(
        service.enroll({ courseId: 'x' } as any, { id: 'me', role: UserRole.STUDENT }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
    it('blocks unpublished course for non-admin', async () => {
      coursesRepo.findById.mockResolvedValue({ id: 'c1', isPublished: false });
      await expect(
        service.enroll({ courseId: 'c1' } as any, { id: 'me', role: UserRole.STUDENT }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('rejects duplicates', async () => {
      coursesRepo.findById.mockResolvedValue({ id: 'c1', isPublished: true });
      repo.findByUserAndCourse.mockResolvedValue({ id: 'existing' });
      await expect(
        service.enroll({ courseId: 'c1' } as any, { id: 'me', role: UserRole.STUDENT }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
    it('creates enrollment with correct connect', async () => {
      coursesRepo.findById.mockResolvedValue({ id: 'c1', isPublished: true });
      repo.findByUserAndCourse.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: 'new' });
      await service.enroll({ courseId: 'c1' } as any, { id: 'me', role: UserRole.STUDENT });
      const data = repo.create.mock.calls[0][0];
      expect(data.user).toEqual({ connect: { id: 'me' } });
      expect(data.course).toEqual({ connect: { id: 'c1' } });
    });
    it('admin can enroll in unpublished course', async () => {
      coursesRepo.findById.mockResolvedValue({ id: 'c1', isPublished: false });
      repo.findByUserAndCourse.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: 'new' });
      await expect(
        service.enroll({ courseId: 'c1' } as any, { id: 'admin', role: UserRole.ADMIN }),
      ).resolves.toEqual({ id: 'new' });
    });
  });

  describe('findById / withdraw / touchLastAccess', () => {
    it('findById blocks foreign access', async () => {
      repo.findById.mockResolvedValue({ id: 'e1', userId: 'someone' });
      await expect(
        service.findById('e1', { id: 'me', role: UserRole.STUDENT }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('findById throws when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.findById('e1', { id: 'me', role: UserRole.STUDENT }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
    it('withdraw soft-deletes', async () => {
      repo.findById.mockResolvedValue({ id: 'e1', userId: 'me' });
      repo.softDelete.mockResolvedValue({ id: 'e1' });
      await expect(
        service.withdraw('e1', { id: 'me', role: UserRole.STUDENT }),
      ).resolves.toEqual({ id: 'e1', deleted: true });
    });
    it('withdraw throws when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.withdraw('x', { id: 'admin', role: UserRole.ADMIN }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
    it('touchLastAccess updates lastAccessAt', async () => {
      repo.findById.mockResolvedValue({ id: 'e1', userId: 'me' });
      repo.update.mockResolvedValue({ id: 'e1' });
      await service.touchLastAccess('e1', { id: 'me', role: UserRole.STUDENT });
      const data = repo.update.mock.calls[0][1];
      expect(data.lastAccessAt).toBeInstanceOf(Date);
    });
    it('touchLastAccess throws when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.touchLastAccess('x', { id: 'admin', role: UserRole.ADMIN }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
