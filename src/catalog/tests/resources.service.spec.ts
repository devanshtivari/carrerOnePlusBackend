import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ResourceKind, UserRole } from '@prisma/client';

import { CoursesRepository } from '../courses.repository';
import { ResourcesRepository } from '../resources.repository';
import { ResourcesService } from '../resources.service';
import { UnitsRepository } from '../units.repository';

describe('ResourcesService', () => {
  let service: ResourcesService;
  const repo = {
    findById: jest.fn(),
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
        ResourcesService,
        { provide: ResourcesRepository, useValue: repo },
        { provide: UnitsRepository, useValue: unitsRepo },
        { provide: CoursesRepository, useValue: coursesRepo },
      ],
    }).compile();
    service = moduleRef.get(ResourcesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('listByUnit throws when unit missing', async () => {
    unitsRepo.findById.mockResolvedValue(null);
    await expect(service.listByUnit('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create blocks unauthorised instructor', async () => {
    unitsRepo.findById.mockResolvedValue({ id: 'u1', courseId: 'c1' });
    coursesRepo.findById.mockResolvedValue({ id: 'c1', instructorId: 'other' });
    await expect(
      service.create(
        { unitId: 'u1', name: 'doc', kind: ResourceKind.PDF } as any,
        { id: 'me', role: UserRole.INSTRUCTOR },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('create succeeds for admin', async () => {
    unitsRepo.findById.mockResolvedValue({ id: 'u1', courseId: 'c1' });
    repo.create.mockResolvedValue({ id: 'r1' });
    const result = await service.create(
      { unitId: 'u1', name: 'doc', kind: ResourceKind.PDF } as any,
      { id: 'admin', role: UserRole.ADMIN },
    );
    expect(repo.create).toHaveBeenCalled();
    expect(result.id).toBe('r1');
  });

  it('soft-delete returns ack payload', async () => {
    repo.findById.mockResolvedValue({ id: 'r1', unitId: 'u1' });
    unitsRepo.findById.mockResolvedValue({ id: 'u1', courseId: 'c1' });
    coursesRepo.findById.mockResolvedValue({ id: 'c1', instructorId: 'me' });
    repo.softDelete.mockResolvedValue({ id: 'r1' });
    const result = await service.remove('r1', { id: 'me', role: UserRole.INSTRUCTOR });
    expect(result).toEqual({ id: 'r1', deleted: true });
  });

  it('findById throws NotFound', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.findById('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  describe('update', () => {
    it('throws when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.update('r1', { name: 'x' } as any, { id: 'admin', role: UserRole.ADMIN }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
    it('updates attached resource for admin', async () => {
      repo.findById.mockResolvedValue({ id: 'r1', unitId: 'u1' });
      unitsRepo.findById.mockResolvedValue({ id: 'u1', courseId: 'c1' });
      repo.update.mockResolvedValue({ id: 'r1' });
      await service.update(
        'r1',
        { name: 'New', kind: ResourceKind.LINK } as any,
        { id: 'admin', role: UserRole.ADMIN },
      );
      expect(repo.update).toHaveBeenCalled();
    });
    it('blocks instructor on unattached resource', async () => {
      repo.findById.mockResolvedValue({ id: 'r1', unitId: null });
      await expect(
        service.update('r1', { name: 'x' } as any, { id: 'me', role: UserRole.INSTRUCTOR }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('allows admin on unattached resource', async () => {
      repo.findById.mockResolvedValue({ id: 'r1', unitId: null });
      repo.update.mockResolvedValue({ id: 'r1' });
      await service.update(
        'r1',
        { name: 'New' } as any,
        { id: 'admin', role: UserRole.ADMIN },
      );
      expect(repo.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.remove('r1', { id: 'admin', role: UserRole.ADMIN }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
    it('blocks instructor on unattached resource', async () => {
      repo.findById.mockResolvedValue({ id: 'r1', unitId: null });
      await expect(
        service.remove('r1', { id: 'me', role: UserRole.INSTRUCTOR }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('allows admin on unattached resource', async () => {
      repo.findById.mockResolvedValue({ id: 'r1', unitId: null });
      repo.softDelete.mockResolvedValue({ id: 'r1' });
      await expect(
        service.remove('r1', { id: 'admin', role: UserRole.ADMIN }),
      ).resolves.toEqual({ id: 'r1', deleted: true });
    });
  });
});
