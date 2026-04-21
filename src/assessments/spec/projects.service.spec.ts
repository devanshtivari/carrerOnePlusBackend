import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionStatus, UserRole } from '@prisma/client';

import { ProjectsRepository } from '../projects/projects.repository';
import { ProjectsService } from '../projects/projects.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  const repo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByUnit: jest.fn(),
    findByCourse: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
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
      providers: [ProjectsService, { provide: ProjectsRepository, useValue: repo }],
    }).compile();
    service = moduleRef.get(ProjectsService);
  });

  afterEach(() => jest.clearAllMocks());

  const STUDENT = { id: 'u1', role: UserRole.STUDENT };
  const INSTRUCTOR = { id: 'i1', role: UserRole.INSTRUCTOR };
  const ADMIN = { id: 'admin', role: UserRole.ADMIN };

  describe('list', () => {
    it('paginates with filters', async () => {
      repo.findAll.mockResolvedValue({ items: [], total: 0 });
      await service.list({
        courseId: 'c1',
        unitId: 'u1',
        isActive: true,
        search: 'cat',
      } as any);
      const args = repo.findAll.mock.calls[0][0];
      expect(args.where.courseId).toBe('c1');
      expect(args.where.unitId).toBe('u1');
      expect(args.where.isActive).toBe(true);
      expect(args.where.OR).toBeDefined();
    });
  });

  describe('listForUnit / listForCourse / findById', () => {
    it('lists for unit', async () => {
      repo.findByUnit.mockResolvedValue([{ id: 'p1' }]);
      await expect(service.listForUnit('u1')).resolves.toEqual([{ id: 'p1' }]);
    });
    it('lists for course', async () => {
      repo.findByCourse.mockResolvedValue([{ id: 'p1' }]);
      await expect(service.listForCourse('c1')).resolves.toEqual([{ id: 'p1' }]);
    });
    it('throws on missing project', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('p1')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('returns project by id', async () => {
      repo.findById.mockResolvedValue({ id: 'p1' });
      await expect(service.findById('p1')).resolves.toEqual({ id: 'p1' });
    });
  });

  describe('create / update / remove', () => {
    it('creates with defaults', async () => {
      repo.create.mockResolvedValue({ id: 'p1' });
      await service.create({ title: 't', deadline: '2026-01-01' } as any);
      const data = repo.create.mock.calls[0][0];
      expect(data.totalMarks).toBe(100);
      expect(data.deadline).toBeInstanceOf(Date);
    });
    it('throws on update missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('p1', {} as any)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
    it('updates and disconnects relations', async () => {
      repo.findById.mockResolvedValue({ id: 'p1' });
      repo.update.mockResolvedValue({ id: 'p1' });
      await service.update('p1', { courseId: '', unitId: '' } as any);
      const data = repo.update.mock.calls[0][1];
      expect(data.course).toEqual({ disconnect: true });
      expect(data.unit).toEqual({ disconnect: true });
    });
    it('removes existing project', async () => {
      repo.findById.mockResolvedValue({ id: 'p1' });
      repo.softDelete.mockResolvedValue({ id: 'p1' });
      await expect(service.remove('p1')).resolves.toEqual({ id: 'p1', deleted: true });
    });
    it('throws on remove missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.remove('p1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('submit', () => {
    it('throws on missing project', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.submit('p1', { fileName: 'a.zip' } as any, STUDENT),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
    it('rejects when project inactive', async () => {
      repo.findById.mockResolvedValue({ id: 'p1', isActive: false });
      await expect(
        service.submit('p1', { fileName: 'a.zip' } as any, STUDENT),
      ).rejects.toBeInstanceOf(ConflictException);
    });
    it('upserts and returns submission', async () => {
      repo.findById.mockResolvedValue({ id: 'p1', isActive: true });
      repo.findSubmission.mockResolvedValue({ id: 's1' });
      const result = await service.submit(
        'p1',
        { fileName: 'a.zip', fileSize: '1MB', fileUrl: 'https://example.com/a.zip' } as any,
        STUDENT,
      );
      expect(repo.upsertSubmission).toHaveBeenCalled();
      expect(result).toEqual({ id: 's1' });
    });
  });

  describe('listSubmissions / listMySubmissions', () => {
    it('throws when project missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.listSubmissions('p1', STUDENT)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
    it('returns only own submission for students', async () => {
      repo.findById.mockResolvedValue({ id: 'p1' });
      repo.findSubmission.mockResolvedValue({ id: 's1' });
      await expect(service.listSubmissions('p1', STUDENT)).resolves.toEqual([{ id: 's1' }]);
    });
    it('returns empty array if student has no submission', async () => {
      repo.findById.mockResolvedValue({ id: 'p1' });
      repo.findSubmission.mockResolvedValue(null);
      await expect(service.listSubmissions('p1', STUDENT)).resolves.toEqual([]);
    });
    it('returns all for admin/instructor', async () => {
      repo.findById.mockResolvedValue({ id: 'p1' });
      repo.listSubmissions.mockResolvedValue([{ id: 's1' }, { id: 's2' }]);
      await expect(service.listSubmissions('p1', ADMIN)).resolves.toHaveLength(2);
    });
    it('lists my submissions', async () => {
      repo.listSubmissionsForUser.mockResolvedValue([{ id: 's1' }]);
      await expect(service.listMySubmissions(STUDENT)).resolves.toEqual([{ id: 's1' }]);
    });
  });

  describe('grade', () => {
    it('blocks students', async () => {
      await expect(
        service.grade('s1', { marksAwarded: 10 } as any, STUDENT),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('throws when submission missing', async () => {
      repo.findSubmissionById.mockResolvedValue(null);
      await expect(
        service.grade('s1', { marksAwarded: 10 } as any, INSTRUCTOR),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
    it('rejects marks above project total', async () => {
      repo.findSubmissionById.mockResolvedValue({ id: 's1', projectId: 'p1' });
      repo.findById.mockResolvedValue({ id: 'p1', totalMarks: 50 });
      await expect(
        service.grade('s1', { marksAwarded: 100 } as any, INSTRUCTOR),
      ).rejects.toBeInstanceOf(ConflictException);
    });
    it('grades and returns updated submission', async () => {
      repo.findSubmissionById
        .mockResolvedValueOnce({ id: 's1', projectId: 'p1' })
        .mockResolvedValueOnce({ id: 's1', status: SubmissionStatus.GRADED });
      repo.findById.mockResolvedValue({ id: 'p1', totalMarks: 100 });
      const result = await service.grade('s1', { marksAwarded: 85 } as any, INSTRUCTOR);
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
    it('allows admin to withdraw', async () => {
      repo.findSubmissionById.mockResolvedValue({ id: 's1', userId: 'someone' });
      await expect(service.withdrawSubmission('s1', ADMIN)).resolves.toEqual({
        id: 's1',
        deleted: true,
      });
    });
  });
});
