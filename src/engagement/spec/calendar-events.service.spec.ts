import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CalendarEventType, UserRole } from '@prisma/client';

import { CalendarEventsRepository } from '../calendar-events.repository';
import { CalendarEventsService } from '../calendar-events.service';

describe('CalendarEventsService', () => {
  let service: CalendarEventsService;
  const repo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarEventsService,
        { provide: CalendarEventsRepository, useValue: repo },
      ],
    }).compile();
    service = moduleRef.get(CalendarEventsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('list applies date range and type filter', async () => {
    repo.findAll.mockResolvedValue({ items: [], total: 0 });
    const from = new Date('2026-01-01').toISOString();
    const to = new Date('2026-12-31').toISOString();
    await service.list({ from, to, type: CalendarEventType.MEETING } as any);
    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: CalendarEventType.MEETING,
          startsAt: { gte: new Date(from), lte: new Date(to) },
        }),
      }),
    );
  });

  it('findById throws on missing', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.findById('x')).rejects.toThrow(NotFoundException);
  });

  it('create connects owner + defaults type to EVENT', async () => {
    repo.create.mockResolvedValue({ id: 'e1' });
    const startsAt = new Date('2026-04-20T10:00:00Z').toISOString();
    await service.create(
      { title: 'Meet', startsAt },
      { id: 'u1', role: UserRole.INSTRUCTOR },
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: CalendarEventType.EVENT,
        owner: { connect: { id: 'u1' } },
        startsAt: new Date(startsAt),
      }),
    );
  });

  it('update forbids non-owner instructor', async () => {
    repo.findById.mockResolvedValue({ id: 'e1', ownerId: 'someone' });
    await expect(
      service.update('e1', { title: 'x' }, { id: 'u1', role: UserRole.INSTRUCTOR }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('update allows admin and patches', async () => {
    repo.findById.mockResolvedValue({ id: 'e1', ownerId: 'someone' });
    repo.update.mockResolvedValue({ id: 'e1' });
    await service.update('e1', { title: 'x' }, { id: 'admin', role: UserRole.ADMIN });
    expect(repo.update).toHaveBeenCalledWith('e1', { title: 'x' });
  });

  it('remove forbids non-owner instructor', async () => {
    repo.findById.mockResolvedValue({ id: 'e1', ownerId: 'other' });
    await expect(
      service.remove('e1', { id: 'u1', role: UserRole.INSTRUCTOR }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('remove soft-deletes for owner', async () => {
    repo.findById.mockResolvedValue({ id: 'e1', ownerId: 'u1' });
    repo.softDelete.mockResolvedValue({ id: 'e1' });
    await expect(
      service.remove('e1', { id: 'u1', role: UserRole.INSTRUCTOR }),
    ).resolves.toEqual({ id: 'e1', deleted: true });
  });
});
