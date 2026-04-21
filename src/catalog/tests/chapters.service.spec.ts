import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';

import { ChaptersRepository } from '../chapters.repository';
import { ChaptersService } from '../chapters.service';
import { CoursesRepository } from '../courses.repository';
import { UnitsRepository } from '../units.repository';

describe('ChaptersService', () => {
  let service: ChaptersService;
  const chaptersRepo = {
    findById: jest.fn(),
    findByUnitAndPosition: jest.fn(),
    findAllByUnit: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };
  const unitsRepo = { findById: jest.fn() };
  const coursesRepo = { findById: jest.fn() };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ChaptersService,
        { provide: ChaptersRepository, useValue: chaptersRepo },
        { provide: UnitsRepository, useValue: unitsRepo },
        { provide: CoursesRepository, useValue: coursesRepo },
      ],
    }).compile();
    service = moduleRef.get(ChaptersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('listByUnit throws when unit missing', async () => {
    unitsRepo.findById.mockResolvedValue(null);
    await expect(service.listByUnit('u-x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create rejects duplicate position', async () => {
    unitsRepo.findById.mockResolvedValue({ id: 'u1', courseId: 'c1' });
    coursesRepo.findById.mockResolvedValue({ id: 'c1', instructorId: 'me' });
    chaptersRepo.findByUnitAndPosition.mockResolvedValue({ id: 'existing' });
    await expect(
      service.create(
        { unitId: 'u1', title: 'Ch', position: 1 } as any,
        { id: 'me', role: UserRole.INSTRUCTOR },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('create blocks unauthorised instructor', async () => {
    unitsRepo.findById.mockResolvedValue({ id: 'u1', courseId: 'c1' });
    coursesRepo.findById.mockResolvedValue({ id: 'c1', instructorId: 'other' });
    await expect(
      service.create(
        { unitId: 'u1', title: 'Ch', position: 1 } as any,
        { id: 'me', role: UserRole.INSTRUCTOR },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('create succeeds for admin', async () => {
    unitsRepo.findById.mockResolvedValue({ id: 'u1', courseId: 'c1' });
    chaptersRepo.findByUnitAndPosition.mockResolvedValue(null);
    chaptersRepo.create.mockResolvedValue({ id: 'ch1' });
    await service.create(
      { unitId: 'u1', title: 'Ch', position: 1 } as any,
      { id: 'admin', role: UserRole.ADMIN },
    );
    expect(chaptersRepo.create).toHaveBeenCalled();
  });

  it('findById throws when missing', async () => {
    chaptersRepo.findById.mockResolvedValue(null);
    await expect(service.findById('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  describe('update', () => {
    it('throws when missing', async () => {
      chaptersRepo.findById.mockResolvedValue(null);
      await expect(
        service.update('ch1', { title: 'x' } as any, { id: 'admin', role: UserRole.ADMIN }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
    it('rejects duplicate position', async () => {
      chaptersRepo.findById.mockResolvedValue({ id: 'ch1', unitId: 'u1', position: 1 });
      unitsRepo.findById.mockResolvedValue({ id: 'u1', courseId: 'c1' });
      chaptersRepo.findByUnitAndPosition.mockResolvedValue({ id: 'other' });
      await expect(
        service.update('ch1', { position: 2 } as any, { id: 'admin', role: UserRole.ADMIN }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
    it('updates fields', async () => {
      chaptersRepo.findById.mockResolvedValue({ id: 'ch1', unitId: 'u1', position: 1 });
      unitsRepo.findById.mockResolvedValue({ id: 'u1', courseId: 'c1' });
      chaptersRepo.findByUnitAndPosition.mockResolvedValue(null);
      chaptersRepo.update.mockResolvedValue({ id: 'ch1' });
      await service.update(
        'ch1',
        { title: 'New', position: 2 } as any,
        { id: 'admin', role: UserRole.ADMIN },
      );
      expect(chaptersRepo.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws when missing', async () => {
      chaptersRepo.findById.mockResolvedValue(null);
      await expect(
        service.remove('ch1', { id: 'admin', role: UserRole.ADMIN }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
    it('soft-deletes for admin', async () => {
      chaptersRepo.findById.mockResolvedValue({ id: 'ch1', unitId: 'u1' });
      unitsRepo.findById.mockResolvedValue({ id: 'u1', courseId: 'c1' });
      chaptersRepo.softDelete.mockResolvedValue({ id: 'ch1' });
      await expect(
        service.remove('ch1', { id: 'admin', role: UserRole.ADMIN }),
      ).resolves.toEqual({ id: 'ch1', deleted: true });
    });
  });
});
