import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LabRuntimeStatus } from '@prisma/client';

import { LabsRepository } from '../labs.repository';
import { LabsService } from '../labs.service';

describe('LabsService', () => {
  let service: LabsService;
  const repo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [LabsService, { provide: LabsRepository, useValue: repo }],
    }).compile();
    service = moduleRef.get(LabsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('list applies status filter and pagination', async () => {
    repo.findAll.mockResolvedValue({ items: [], total: 0 });
    await service.list({ status: LabRuntimeStatus.HIGH_TRAFFIC, page: 2, pageSize: 5 } as any);
    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
        where: { status: LabRuntimeStatus.HIGH_TRAFFIC },
      }),
    );
  });

  it('findById throws when missing', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.findById('x')).rejects.toThrow(NotFoundException);
  });

  it('create defaults status and activeUsers', async () => {
    repo.create.mockResolvedValue({ id: 'l1' });
    await service.create({ name: 'X' } as any);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'X',
        status: LabRuntimeStatus.AVAILABLE,
        activeUsers: 0,
      }),
    );
  });

  it('update only patches given fields', async () => {
    repo.findById.mockResolvedValue({ id: 'l1' });
    repo.update.mockResolvedValue({ id: 'l1' });
    await service.update('l1', { activeUsers: 3 });
    expect(repo.update).toHaveBeenCalledWith('l1', { activeUsers: 3 });
  });

  it('remove soft-deletes', async () => {
    repo.findById.mockResolvedValue({ id: 'l1' });
    repo.softDelete.mockResolvedValue({ id: 'l1' });
    await expect(service.remove('l1')).resolves.toEqual({ id: 'l1', deleted: true });
  });
});
