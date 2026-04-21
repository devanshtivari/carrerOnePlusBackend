import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';

import { FeedbackRepository } from '../feedback.repository';
import { FeedbackService } from '../feedback.service';

describe('FeedbackService', () => {
  let service: FeedbackService;
  const repo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [FeedbackService, { provide: FeedbackRepository, useValue: repo }],
    }).compile();
    service = moduleRef.get(FeedbackService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('forces studentId for student actors', async () => {
      repo.findAll.mockResolvedValue({ items: [], total: 0 });
      await service.list({ studentId: 'someoneelse' } as any, {
        id: 'me',
        role: UserRole.STUDENT,
      });
      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ studentId: 'me' }) }),
      );
    });

    it('uses query.studentId for staff', async () => {
      repo.findAll.mockResolvedValue({ items: [], total: 0 });
      await service.list({ studentId: 'student1', contextType: 'PROJECT' } as any, {
        id: 'instr',
        role: UserRole.INSTRUCTOR,
      });
      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { studentId: 'student1', contextType: 'PROJECT' },
        }),
      );
    });
  });

  describe('findById', () => {
    it('throws when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.findById('x', { id: 'u1', role: UserRole.STUDENT }),
      ).rejects.toThrow(NotFoundException);
    });

    it('forbids students viewing other students', async () => {
      repo.findById.mockResolvedValue({ id: 'f1', studentId: 'other' });
      await expect(
        service.findById('f1', { id: 'u1', role: UserRole.STUDENT }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('returns when student owns', async () => {
      repo.findById.mockResolvedValue({ id: 'f1', studentId: 'u1' });
      await expect(
        service.findById('f1', { id: 'u1', role: UserRole.STUDENT }),
      ).resolves.toEqual({ id: 'f1', studentId: 'u1' });
    });
  });

  describe('create', () => {
    it('connects student + instructor', async () => {
      repo.create.mockResolvedValue({ id: 'f1' });
      await service.create(
        { studentId: 's1', body: 'great' },
        { id: 'instr', role: UserRole.INSTRUCTOR },
      );
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          student: { connect: { id: 's1' } },
          instructor: { connect: { id: 'instr' } },
          body: 'great',
        }),
      );
    });
  });

  describe('update', () => {
    it('forbids editing others feedback as instructor', async () => {
      repo.findById.mockResolvedValue({ id: 'f1', instructorId: 'someone' });
      await expect(
        service.update('f1', { body: 'x' }, { id: 'instr', role: UserRole.INSTRUCTOR }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('admin can edit any feedback', async () => {
      repo.findById.mockResolvedValue({ id: 'f1', instructorId: 'someone' });
      repo.update.mockResolvedValue({ id: 'f1' });
      await service.update('f1', { body: 'x' }, { id: 'admin', role: UserRole.ADMIN });
      expect(repo.update).toHaveBeenCalledWith('f1', { body: 'x' });
    });
  });

  describe('remove', () => {
    it('forbids non-author instructor', async () => {
      repo.findById.mockResolvedValue({ id: 'f1', instructorId: 'someone' });
      await expect(
        service.remove('f1', { id: 'instr', role: UserRole.INSTRUCTOR }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('soft-deletes when author', async () => {
      repo.findById.mockResolvedValue({ id: 'f1', instructorId: 'instr' });
      repo.softDelete.mockResolvedValue({ id: 'f1' });
      await expect(
        service.remove('f1', { id: 'instr', role: UserRole.INSTRUCTOR }),
      ).resolves.toEqual({ id: 'f1', deleted: true });
    });
  });
});
