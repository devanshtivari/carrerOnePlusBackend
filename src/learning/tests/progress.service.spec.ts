import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { EnrollmentsRepository } from '../enrollments/enrollments.repository';
import { LessonCompletionsRepository } from '../progress/lesson-completions.repository';
import { ProgressService } from '../progress/progress.service';

describe('ProgressService', () => {
  let service: ProgressService;
  const prisma: any = {
    lesson: { findUnique: jest.fn(), count: jest.fn() },
    course: { findUnique: jest.fn() },
  };
  const completionsRepo = {
    findByUserAndLesson: jest.fn(),
    create: jest.fn(),
    deleteByUserAndLesson: jest.fn(),
    listByUserAndCourse: jest.fn(),
  };
  const enrollmentsRepo = {
    findByUserAndCourse: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        { provide: PrismaService, useValue: prisma },
        { provide: LessonCompletionsRepository, useValue: completionsRepo },
        { provide: EnrollmentsRepository, useValue: enrollmentsRepo },
      ],
    }).compile();
    service = moduleRef.get(ProgressService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('markLessonComplete', () => {
    it('throws when lesson missing', async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);
      await expect(
        service.markLessonComplete('l1', { id: 'me', role: UserRole.STUDENT }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
    it('blocks non-admin without enrollment', async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: 'l1',
        chapter: { id: 'ch1', unit: { id: 'u1', courseId: 'c1' } },
      });
      enrollmentsRepo.findByUserAndCourse.mockResolvedValue(null);
      await expect(
        service.markLessonComplete('l1', { id: 'me', role: UserRole.STUDENT }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('creates completion + recalculates progress', async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: 'l1',
        chapter: { id: 'ch1', unit: { id: 'u1', courseId: 'c1' } },
      });
      const enrollment = { id: 'e1', completedAt: null };
      enrollmentsRepo.findByUserAndCourse.mockResolvedValue(enrollment);
      completionsRepo.findByUserAndLesson.mockResolvedValue(null);
      prisma.course.findUnique.mockResolvedValue({ id: 'c1', totalLessons: 4 });
      completionsRepo.listByUserAndCourse.mockResolvedValue([
        { lessonId: 'l1' },
        { lessonId: 'l2' },
      ]);
      enrollmentsRepo.update.mockResolvedValue({ id: 'e1' });

      const result = await service.markLessonComplete('l1', { id: 'me', role: UserRole.STUDENT });

      expect(completionsRepo.create).toHaveBeenCalled();
      expect(enrollmentsRepo.update).toHaveBeenCalledWith(
        'e1',
        expect.objectContaining({ progress: 50 }),
      );
      expect(result.progressPercent).toBe(50);
      expect(result.totalLessons).toBe(4);
      expect(result.completedLessons).toBe(2);
      expect(result.completedAt).toBeNull();
    });
    it('marks course complete when all lessons done', async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: 'l4',
        chapter: { id: 'ch1', unit: { id: 'u1', courseId: 'c1' } },
      });
      enrollmentsRepo.findByUserAndCourse.mockResolvedValue({ id: 'e1', completedAt: null });
      completionsRepo.findByUserAndLesson.mockResolvedValue({ id: 'lc1' });
      prisma.course.findUnique.mockResolvedValue({ id: 'c1', totalLessons: 4 });
      completionsRepo.listByUserAndCourse.mockResolvedValue([
        { lessonId: 'l1' },
        { lessonId: 'l2' },
        { lessonId: 'l3' },
        { lessonId: 'l4' },
      ]);
      enrollmentsRepo.update.mockResolvedValue({ id: 'e1' });
      const result = await service.markLessonComplete('l4', { id: 'me', role: UserRole.STUDENT });
      expect(result.progressPercent).toBe(100);
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(completionsRepo.create).not.toHaveBeenCalled();
    });
    it('admin can mark without enrollment', async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: 'l1',
        chapter: { id: 'ch1', unit: { id: 'u1', courseId: 'c1' } },
      });
      enrollmentsRepo.findByUserAndCourse.mockResolvedValue(null);
      completionsRepo.findByUserAndLesson.mockResolvedValue(null);
      prisma.course.findUnique.mockResolvedValue({ id: 'c1', totalLessons: null });
      prisma.lesson.count.mockResolvedValue(0);
      completionsRepo.listByUserAndCourse.mockResolvedValue([]);
      const result = await service.markLessonComplete('l1', { id: 'admin', role: UserRole.ADMIN });
      expect(result.progressPercent).toBe(0);
      expect(result.enrollmentId).toBeNull();
    });
  });

  describe('unmarkLessonComplete', () => {
    it('throws when lesson missing', async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);
      await expect(
        service.unmarkLessonComplete('l1', { id: 'me', role: UserRole.STUDENT }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
    it('uncompletes course if was complete', async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: 'l1',
        chapter: { unit: { courseId: 'c1' } },
      });
      enrollmentsRepo.findByUserAndCourse.mockResolvedValue({
        id: 'e1',
        completedAt: new Date(),
      });
      completionsRepo.findByUserAndLesson.mockResolvedValue({ id: 'lc1' });
      prisma.course.findUnique.mockResolvedValue({ id: 'c1', totalLessons: 4 });
      completionsRepo.listByUserAndCourse.mockResolvedValue([{ lessonId: 'l2' }]);
      enrollmentsRepo.update.mockResolvedValue({ id: 'e1' });

      const result = await service.unmarkLessonComplete('l1', {
        id: 'me',
        role: UserRole.STUDENT,
      });
      expect(completionsRepo.deleteByUserAndLesson).toHaveBeenCalled();
      const updateData = enrollmentsRepo.update.mock.calls[0][1];
      expect(updateData.completedAt).toBeNull();
      expect(result.progressPercent).toBe(25);
    });
  });

  describe('getCourseProgress', () => {
    it('does not persist progress on read', async () => {
      enrollmentsRepo.findByUserAndCourse.mockResolvedValue({ id: 'e1', completedAt: null });
      prisma.course.findUnique.mockResolvedValue({ id: 'c1', totalLessons: 2 });
      completionsRepo.listByUserAndCourse.mockResolvedValue([{ lessonId: 'l1' }]);
      const result = await service.getCourseProgress('c1', { id: 'me', role: UserRole.STUDENT });
      expect(enrollmentsRepo.update).not.toHaveBeenCalled();
      expect(result.progressPercent).toBe(50);
    });
    it('throws when course missing', async () => {
      enrollmentsRepo.findByUserAndCourse.mockResolvedValue(null);
      prisma.course.findUnique.mockResolvedValue(null);
      completionsRepo.listByUserAndCourse.mockResolvedValue([]);
      await expect(
        service.getCourseProgress('c1', { id: 'me', role: UserRole.STUDENT }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getCourseProgressForUser', () => {
    it('blocks non-self non-admin', async () => {
      await expect(
        service.getCourseProgressForUser('other', 'c1', { id: 'me', role: UserRole.STUDENT }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('admin can fetch any user', async () => {
      enrollmentsRepo.findByUserAndCourse.mockResolvedValue(null);
      prisma.course.findUnique.mockResolvedValue({ id: 'c1', totalLessons: 0 });
      prisma.lesson.count.mockResolvedValue(0);
      completionsRepo.listByUserAndCourse.mockResolvedValue([]);
      const result = await service.getCourseProgressForUser('other', 'c1', {
        id: 'admin',
        role: UserRole.ADMIN,
      });
      expect(result.progressPercent).toBe(0);
    });
  });
});
