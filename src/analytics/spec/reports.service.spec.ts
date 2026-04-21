import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ReportKind, UserRole } from '@prisma/client';

import { ReportsRepository } from '../reports.repository';
import { ReportsService } from '../reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  const repo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [ReportsService, { provide: ReportsRepository, useValue: repo }],
    }).compile();
    service = moduleRef.get(ReportsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('non-admin list is scoped to ownerId', async () => {
    repo.findAll.mockResolvedValue({ items: [], total: 0 });
    await service.list({ kind: ReportKind.TREND } as any, { id: 'me', role: UserRole.INSTRUCTOR });
    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: 'me', kind: ReportKind.TREND },
      }),
    );
  });

  it('admin sees all', async () => {
    repo.findAll.mockResolvedValue({ items: [], total: 0 });
    await service.list({} as any, { id: 'admin', role: UserRole.ADMIN });
    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('findById forbids non-owner non-admin', async () => {
    repo.findById.mockResolvedValue({ id: 'r1', ownerId: 'someone' });
    await expect(
      service.findById('r1', { id: 'me', role: UserRole.INSTRUCTOR }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('findById throws on missing', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(
      service.findById('x', { id: 'me', role: UserRole.INSTRUCTOR }),
    ).rejects.toThrow(NotFoundException);
  });

  it('create attaches owner + defaults kind', async () => {
    repo.create.mockResolvedValue({ id: 'r1' });
    await service.create({ title: 'X' } as any, { id: 'me', role: UserRole.INSTRUCTOR });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'X',
        kind: ReportKind.CUSTOM,
        owner: { connect: { id: 'me' } },
      }),
    );
  });

  it('update forbids non-owner instructor', async () => {
    repo.findById.mockResolvedValue({ id: 'r1', ownerId: 'other' });
    await expect(
      service.update('r1', { title: 'Y' }, { id: 'me', role: UserRole.INSTRUCTOR }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('remove allows owner', async () => {
    repo.findById.mockResolvedValue({ id: 'r1', ownerId: 'me' });
    repo.softDelete.mockResolvedValue({ id: 'r1' });
    await expect(
      service.remove('r1', { id: 'me', role: UserRole.INSTRUCTOR }),
    ).resolves.toEqual({ id: 'r1', deleted: true });
  });
});
