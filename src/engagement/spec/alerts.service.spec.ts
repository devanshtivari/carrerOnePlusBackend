import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AlertPriority, UserRole } from '@prisma/client';

import { AlertsRepository } from '../alerts.repository';
import { AlertsService } from '../alerts.service';

describe('AlertsService', () => {
  let service: AlertsService;
  const repo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    resolve: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [AlertsService, { provide: AlertsRepository, useValue: repo }],
    }).compile();
    service = moduleRef.get(AlertsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('list applies priority + resolved filters', async () => {
    repo.findAll.mockResolvedValue({ items: [], total: 0 });
    await service.list({ priority: AlertPriority.HIGH, resolved: true } as any);
    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { priority: AlertPriority.HIGH, resolvedAt: { not: null } },
      }),
    );
  });

  it('list resolved=false sets resolvedAt null', async () => {
    repo.findAll.mockResolvedValue({ items: [], total: 0 });
    await service.list({ resolved: false } as any);
    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { resolvedAt: null } }),
    );
  });

  it('findById throws when missing', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.findById('x')).rejects.toThrow(NotFoundException);
  });

  it('create defaults priority to MEDIUM', async () => {
    repo.create.mockResolvedValue({ id: 'a1' });
    await service.create({ title: 't', message: 'm' } as any);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ priority: AlertPriority.MEDIUM }),
    );
  });

  it('update only patches given fields', async () => {
    repo.findById.mockResolvedValue({ id: 'a1' });
    repo.update.mockResolvedValue({ id: 'a1' });
    await service.update('a1', { title: 'new' });
    expect(repo.update).toHaveBeenCalledWith('a1', { title: 'new' });
  });

  it('resolve calls repo.resolve with actor id', async () => {
    repo.findById.mockResolvedValue({ id: 'a1' });
    repo.resolve.mockResolvedValue({ id: 'a1', resolvedAt: new Date() });
    await service.resolve('a1', { id: 'u1', role: UserRole.ADMIN });
    expect(repo.resolve).toHaveBeenCalledWith('a1', 'u1');
  });

  it('remove soft-deletes', async () => {
    repo.findById.mockResolvedValue({ id: 'a1' });
    repo.softDelete.mockResolvedValue({ id: 'a1' });
    await expect(service.remove('a1')).resolves.toEqual({ id: 'a1', deleted: true });
  });
});
