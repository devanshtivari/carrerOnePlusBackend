import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UnitStatus, UserRole } from '@prisma/client';

import { CoursesRepository } from '../courses.repository';
import { UnitsRepository } from '../units.repository';
import { UnitsService } from '../units.service';

describe('UnitsService', () => {
  let service: UnitsService;
  const unitsRepo = {
    findById: jest.fn(),
    findAllByCourse: jest.fn(),
    findByCourseAndModule: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };
  const coursesRepo = { findById: jest.fn() };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UnitsService,
        { provide: UnitsRepository, useValue: unitsRepo },
        { provide: CoursesRepository, useValue: coursesRepo },
      ],
    }).compile();
    service = moduleRef.get(UnitsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('listByCourse', () => {
    it('throws when course missing', async () => {
      coursesRepo.findById.mockResolvedValue(null);
      await expect(service.listByCourse('x')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('returns units in order', async () => {
      coursesRepo.findById.mockResolvedValue({ id: 'c1' });
      unitsRepo.findAllByCourse.mockResolvedValue([{ moduleNumber: 1 }, { moduleNumber: 2 }]);
      const result = await service.listByCourse('c1');
      expect(result).toHaveLength(2);
    });
  });

  describe('create', () => {
    it('rejects duplicate moduleNumber within a course', async () => {
      coursesRepo.findById.mockResolvedValue({ id: 'c1', instructorId: 'me' });
      unitsRepo.findByCourseAndModule.mockResolvedValue({ id: 'existing' });
      await expect(
        service.create(
          { courseId: 'c1', moduleNumber: 1, title: 'Intro' } as any,
          { id: 'me', role: UserRole.INSTRUCTOR },
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
    it('blocks instructor without ownership', async () => {
      coursesRepo.findById.mockResolvedValue({ id: 'c1', instructorId: 'someone-else' });
      await expect(
        service.create(
          { courseId: 'c1', moduleNumber: 1, title: 'Intro' } as any,
          { id: 'me', role: UserRole.INSTRUCTOR },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('persists with course connect', async () => {
      coursesRepo.findById.mockResolvedValue({ id: 'c1', instructorId: 'me' });
      unitsRepo.findByCourseAndModule.mockResolvedValue(null);
      unitsRepo.create.mockResolvedValue({ id: 'u1' });
      await service.create(
        {
          courseId: 'c1',
          moduleNumber: 2,
          title: 'Unit Two',
          status: UnitStatus.LOCKED,
        } as any,
        { id: 'me', role: UserRole.INSTRUCTOR },
      );
      const data = unitsRepo.create.mock.calls[0][0];
      expect(data.course).toEqual({ connect: { id: 'c1' } });
      expect(data.moduleNumber).toBe(2);
    });
  });

  describe('remove', () => {
    it('soft-deletes', async () => {
      unitsRepo.findById.mockResolvedValue({ id: 'u1', courseId: 'c1' });
      coursesRepo.findById.mockResolvedValue({ id: 'c1', instructorId: 'me' });
      unitsRepo.softDelete.mockResolvedValue({ id: 'u1' });
      const result = await service.remove('u1', { id: 'me', role: UserRole.INSTRUCTOR });
      expect(result).toEqual({ id: 'u1', deleted: true });
    });
    it('throws when missing', async () => {
      unitsRepo.findById.mockResolvedValue(null);
      await expect(
        service.remove('u1', { id: 'admin', role: UserRole.ADMIN }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findById', () => {
    it('throws NotFound when missing', async () => {
      unitsRepo.findById.mockResolvedValue(null);
      await expect(service.findById('u1')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('returns when found', async () => {
      unitsRepo.findById.mockResolvedValue({ id: 'u1' });
      await expect(service.findById('u1')).resolves.toMatchObject({ id: 'u1' });
    });
  });

  describe('update', () => {
    it('throws when missing', async () => {
      unitsRepo.findById.mockResolvedValue(null);
      await expect(
        service.update('u1', { title: 'new' } as any, { id: 'admin', role: UserRole.ADMIN }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects duplicate moduleNumber on update', async () => {
      unitsRepo.findById.mockResolvedValue({ id: 'u1', courseId: 'c1', moduleNumber: 1 });
      coursesRepo.findById.mockResolvedValue({ id: 'c1', instructorId: 'me' });
      unitsRepo.findByCourseAndModule.mockResolvedValue({ id: 'other' });
      await expect(
        service.update('u1', { moduleNumber: 2 } as any, { id: 'me', role: UserRole.INSTRUCTOR }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('updates allowed fields', async () => {
      unitsRepo.findById.mockResolvedValue({ id: 'u1', courseId: 'c1', moduleNumber: 1 });
      coursesRepo.findById.mockResolvedValue({ id: 'c1', instructorId: 'me' });
      unitsRepo.update.mockResolvedValue({ id: 'u1', title: 'New' });
      await service.update(
        'u1',
        { title: 'New', status: UnitStatus.IN_PROGRESS } as any,
        { id: 'me', role: UserRole.INSTRUCTOR },
      );
      const data = unitsRepo.update.mock.calls[0][1];
      expect(data.title).toBe('New');
      expect(data.status).toBe(UnitStatus.IN_PROGRESS);
    });
  });
});
