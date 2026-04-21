import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentStatus, SubmissionStatus, UserRole } from '@prisma/client';

import { AssignmentsRepository } from '../assignments/assignments.repository';
import { AssignmentsService } from '../assignments/assignments.service';

describe('AssignmentsService', () => {
  let service: AssignmentsService;
  const repo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByClass: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    incrementSubmittedCount: jest.fn(),
    findSubmission: jest.fn(),
    findSubmissionById: jest.fn(),
    listSubmissions: jest.fn(),
    listSubmissionsForUser: jest.fn(),
    upsertSubmission: jest.fn(),
    updateSubmission: jest.fn(),
    softDeleteSubmission: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [AssignmentsService, { provide: AssignmentsRepository, useValue: repo }],
    }).compile();
    service = moduleRef.get(AssignmentsService);
  });

  afterEach(() => jest.clearAllMocks());

  const STUDENT = { id: 'u1', role: UserRole.STUDENT };
  const INSTRUCTOR = { id: 'i1', role: UserRole.INSTRUCTOR };
  const ADMIN = { id: 'admin', role: UserRole.ADMIN };

  describe('list', () => {
    it('paginates with filters', async () => {
      repo.findAll.mockResolvedValue({ items: [], total: 0 });
      await service.list({
        status: AssignmentStatus.ACTIVE,
        classId: 'c1',
        courseId: 'co1',
        search: 'algo',
      } as any);
      const args = repo.findAll.mock.calls[0][0];
      expect(args.where.status).toBe(AssignmentStatus.ACTIVE);
      expect(args.where.classId).toBe('c1');
      expect(args.where.courseId).toBe('co1');
      expect(args.where.OR).toBeDefined();
    });
  });

  describe('listForClass / findById', () => {
    it('lists for class', async () => {
      repo.findByClass.mockResolvedValue([{ id: 'a1' }]);
      await expect(service.listForClass('c1')).resolves.toEqual([{ id: 'a1' }]);
    });
    it('throws on missing assignment', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('a1')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('returns assignment by id', async () => {
      repo.findById.mockResolvedValue({ id: 'a1' });
      await expect(service.findById('a1')).resolves.toEqual({ id: 'a1' });
    });
  });

  describe('create / update / remove', () => {
    it('creates with relations', async () => {
      repo.create.mockResolvedValue({ id: 'a1' });
      await service.create({
        title: 't',
        dueDate: '2026-01-01',
        classId: 'c1',
        courseId: 'co1',
        status: AssignmentStatus.ACTIVE,
      } as any);
      const data = repo.create.mock.calls[0][0];
      expect(data.class).toEqual({ connect: { id: 'c1' } });
      expect(data.course).toEqual({ connect: { id: 'co1' } });
    });
    it('throws on update missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('a1', {} as any)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
    it('disconnects relations on empty string', async () => {
      repo.findById.mockResolvedValue({ id: 'a1' });
      repo.update.mockResolvedValue({ id: 'a1' });
      await service.update('a1', { classId: '', courseId: '' } as any);
      const data = repo.update.mock.calls[0][1];
      expect(data.class).toEqual({ disconnect: true });
      expect(data.course).toEqual({ disconnect: true });
    });
    it('throws on remove missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.remove('a1')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('removes existing', async () => {
      repo.findById.mockResolvedValue({ id: 'a1' });
      repo.softDelete.mockResolvedValue({ id: 'a1' });
      await expect(service.remove('a1')).resolves.toEqual({ id: 'a1', deleted: true });
    });
  });

  describe('submit', () => {
    it('throws on missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.submit('a1', {} as any, STUDENT)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
    it('rejects archived assignment', async () => {
      repo.findById.mockResolvedValue({ id: 'a1', status: AssignmentStatus.ARCHIVED });
      await expect(service.submit('a1', {} as any, STUDENT)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
    it('upserts a new submission and increments counter', async () => {
      repo.findById.mockResolvedValue({ id: 'a1', status: AssignmentStatus.ACTIVE });
      repo.findSubmission
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 's1' });
      const result = await service.submit('a1', { fileUrl: 'http://x' } as any, STUDENT);
      expect(repo.upsertSubmission).toHaveBeenCalled();
      expect(repo.incrementSubmittedCount).toHaveBeenCalledWith('a1', 1);
      expect(result).toEqual({ id: 's1' });
    });
    it('does not double-increment on resubmission', async () => {
      repo.findById.mockResolvedValue({ id: 'a1', status: AssignmentStatus.ACTIVE });
      repo.findSubmission.mockResolvedValue({ id: 's1' });
      await service.submit('a1', {} as any, STUDENT);
      expect(repo.incrementSubmittedCount).not.toHaveBeenCalled();
    });
  });

  describe('listSubmissions / listMine', () => {
    it('throws when assignment missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.listSubmissions('a1', STUDENT)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
    it('returns own only for students', async () => {
      repo.findById.mockResolvedValue({ id: 'a1' });
      repo.findSubmission.mockResolvedValue({ id: 's1' });
      await expect(service.listSubmissions('a1', STUDENT)).resolves.toEqual([{ id: 's1' }]);
    });
    it('returns empty for student with no submission', async () => {
      repo.findById.mockResolvedValue({ id: 'a1' });
      repo.findSubmission.mockResolvedValue(null);
      await expect(service.listSubmissions('a1', STUDENT)).resolves.toEqual([]);
    });
    it('returns all for admin', async () => {
      repo.findById.mockResolvedValue({ id: 'a1' });
      repo.listSubmissions.mockResolvedValue([{ id: 's1' }, { id: 's2' }]);
      await expect(service.listSubmissions('a1', ADMIN)).resolves.toHaveLength(2);
    });
    it('lists my submissions', async () => {
      repo.listSubmissionsForUser.mockResolvedValue([{ id: 's1' }]);
      await expect(service.listMySubmissions(STUDENT)).resolves.toEqual([{ id: 's1' }]);
    });
  });

  describe('grade', () => {
    it('blocks students', async () => {
      await expect(
        service.grade('s1', { marksAwarded: 10, totalMarks: 100 } as any, STUDENT),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('rejects marksAwarded > totalMarks', async () => {
      await expect(
        service.grade('s1', { marksAwarded: 110, totalMarks: 100 } as any, INSTRUCTOR),
      ).rejects.toBeInstanceOf(ConflictException);
    });
    it('throws when submission missing', async () => {
      repo.findSubmissionById.mockResolvedValue(null);
      await expect(
        service.grade('s1', { marksAwarded: 10, totalMarks: 100 } as any, INSTRUCTOR),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
    it('grades and returns updated submission', async () => {
      repo.findSubmissionById
        .mockResolvedValueOnce({ id: 's1' })
        .mockResolvedValueOnce({ id: 's1', status: SubmissionStatus.GRADED });
      const result = await service.grade(
        's1',
        {
          marksAwarded: 80,
          totalMarks: 100,
          gradeLabel: 'A',
          feedback: 'Great work!',
        } as any,
        INSTRUCTOR,
      );
      expect(repo.updateSubmission).toHaveBeenCalled();
      expect(result.status).toBe(SubmissionStatus.GRADED);
    });
  });

  describe('withdrawSubmission', () => {
    it('throws on missing', async () => {
      repo.findSubmissionById.mockResolvedValue(null);
      await expect(service.withdrawSubmission('s1', STUDENT)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
    it('blocks foreign withdrawal for student', async () => {
      repo.findSubmissionById.mockResolvedValue({ id: 's1', userId: 'someone' });
      await expect(service.withdrawSubmission('s1', STUDENT)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
    it('decrements counter when withdrawing a submitted submission', async () => {
      repo.findSubmissionById.mockResolvedValue({
        id: 's1',
        userId: 'u1',
        assignmentId: 'a1',
        status: SubmissionStatus.SUBMITTED,
      });
      await service.withdrawSubmission('s1', STUDENT);
      expect(repo.incrementSubmittedCount).toHaveBeenCalledWith('a1', -1);
    });
    it('does not decrement when status is NOT_SUBMITTED', async () => {
      repo.findSubmissionById.mockResolvedValue({
        id: 's1',
        userId: 'u1',
        assignmentId: 'a1',
        status: SubmissionStatus.NOT_SUBMITTED,
      });
      await service.withdrawSubmission('s1', STUDENT);
      expect(repo.incrementSubmittedCount).not.toHaveBeenCalled();
    });
  });
});
