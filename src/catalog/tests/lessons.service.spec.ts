import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LessonType, UserRole } from '@prisma/client';

import { ChaptersRepository } from '../chapters.repository';
import { CoursesRepository } from '../courses.repository';
import { LessonsRepository } from '../lessons.repository';
import { LessonsService } from '../lessons.service';
import { UnitsRepository } from '../units.repository';

describe('LessonsService', () => {
  let service: LessonsService;
  const lessonsRepo = {
    findById: jest.fn(),
    findByChapterAndPosition: jest.fn(),
    findAllByChapter: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };
  const chaptersRepo = { findById: jest.fn() };
  const unitsRepo = { findById: jest.fn() };
  const coursesRepo = { findById: jest.fn() };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        LessonsService,
        { provide: LessonsRepository, useValue: lessonsRepo },
        { provide: ChaptersRepository, useValue: chaptersRepo },
        { provide: UnitsRepository, useValue: unitsRepo },
        { provide: CoursesRepository, useValue: coursesRepo },
      ],
    }).compile();
    service = moduleRef.get(LessonsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('listByChapter throws when chapter missing', async () => {
    chaptersRepo.findById.mockResolvedValue(null);
    await expect(service.listByChapter('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create rejects duplicate position', async () => {
    chaptersRepo.findById.mockResolvedValue({ id: 'ch1', unitId: 'u1' });
    unitsRepo.findById.mockResolvedValue({ id: 'u1', courseId: 'c1' });
    coursesRepo.findById.mockResolvedValue({ id: 'c1', instructorId: 'me' });
    lessonsRepo.findByChapterAndPosition.mockResolvedValue({ id: 'existing' });
    await expect(
      service.create(
        { chapterId: 'ch1', position: 1, title: 'L', type: LessonType.LESSON } as any,
        { id: 'me', role: UserRole.INSTRUCTOR },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('create blocks instructor without ownership', async () => {
    chaptersRepo.findById.mockResolvedValue({ id: 'ch1', unitId: 'u1' });
    unitsRepo.findById.mockResolvedValue({ id: 'u1', courseId: 'c1' });
    coursesRepo.findById.mockResolvedValue({ id: 'c1', instructorId: 'other' });
    await expect(
      service.create(
        { chapterId: 'ch1', position: 1, title: 'L', type: LessonType.LESSON } as any,
        { id: 'me', role: UserRole.INSTRUCTOR },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('create succeeds for owning instructor', async () => {
    chaptersRepo.findById.mockResolvedValue({ id: 'ch1', unitId: 'u1' });
    unitsRepo.findById.mockResolvedValue({ id: 'u1', courseId: 'c1' });
    coursesRepo.findById.mockResolvedValue({ id: 'c1', instructorId: 'me' });
    lessonsRepo.findByChapterAndPosition.mockResolvedValue(null);
    lessonsRepo.create.mockResolvedValue({ id: 'l1' });
    await service.create(
      { chapterId: 'ch1', position: 1, title: 'L', type: LessonType.LESSON } as any,
      { id: 'me', role: UserRole.INSTRUCTOR },
    );
    const data = lessonsRepo.create.mock.calls[0][0];
    expect(data.chapter).toEqual({ connect: { id: 'ch1' } });
    expect(data.title).toBe('L');
  });

  it('findById throws NotFound', async () => {
    lessonsRepo.findById.mockResolvedValue(null);
    await expect(service.findById('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  describe('update', () => {
    it('throws when missing', async () => {
      lessonsRepo.findById.mockResolvedValue(null);
      await expect(
        service.update('l1', { title: 'x' } as any, { id: 'admin', role: UserRole.ADMIN }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
    it('rejects duplicate position', async () => {
      lessonsRepo.findById.mockResolvedValue({ id: 'l1', chapterId: 'ch1', position: 1 });
      chaptersRepo.findById.mockResolvedValue({ id: 'ch1', unitId: 'u1' });
      lessonsRepo.findByChapterAndPosition.mockResolvedValue({ id: 'other' });
      await expect(
        service.update('l1', { position: 2 } as any, { id: 'admin', role: UserRole.ADMIN }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
    it('updates fields for admin', async () => {
      lessonsRepo.findById.mockResolvedValue({ id: 'l1', chapterId: 'ch1', position: 1 });
      chaptersRepo.findById.mockResolvedValue({ id: 'ch1', unitId: 'u1' });
      lessonsRepo.update.mockResolvedValue({ id: 'l1' });
      await service.update(
        'l1',
        { title: 'New', type: LessonType.QUIZ } as any,
        { id: 'admin', role: UserRole.ADMIN },
      );
      expect(lessonsRepo.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws when missing', async () => {
      lessonsRepo.findById.mockResolvedValue(null);
      await expect(
        service.remove('l1', { id: 'admin', role: UserRole.ADMIN }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
    it('soft-deletes for admin', async () => {
      lessonsRepo.findById.mockResolvedValue({ id: 'l1', chapterId: 'ch1' });
      chaptersRepo.findById.mockResolvedValue({ id: 'ch1', unitId: 'u1' });
      lessonsRepo.softDelete.mockResolvedValue({ id: 'l1' });
      await expect(
        service.remove('l1', { id: 'admin', role: UserRole.ADMIN }),
      ).resolves.toEqual({ id: 'l1', deleted: true });
    });
  });
});
