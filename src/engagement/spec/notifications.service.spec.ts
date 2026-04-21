import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType, UserRole } from '@prisma/client';

import { NotificationsRepository } from '../notifications.repository';
import { NotificationsService } from '../notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  const repo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: NotificationsRepository, useValue: repo },
      ],
    }).compile();
    service = moduleRef.get(NotificationsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('listForUser', () => {
    it('filters by user, type, unreadOnly + returns unread count', async () => {
      repo.findAll.mockResolvedValue({ items: [{ id: 'n1' }], total: 1, unread: 1 });
      const res = await service.listForUser('u1', {
        unreadOnly: true,
        type: NotificationType.ALERT,
      } as any);
      expect(res.unread).toBe(1);
      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'u1', readAt: null, type: NotificationType.ALERT },
        }),
      );
    });
  });

  describe('create', () => {
    it('forbids students addressing other users', async () => {
      await expect(
        service.create(
          { userId: 'u2', type: NotificationType.SYSTEM, title: 't', body: 'b' },
          { id: 'u1', role: UserRole.STUDENT },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows admin to send to anyone', async () => {
      repo.create.mockResolvedValue({ id: 'n1' });
      await service.create(
        { userId: 'u2', type: NotificationType.SYSTEM, title: 't', body: 'b' },
        { id: 'admin', role: UserRole.ADMIN },
      );
      expect(repo.create).toHaveBeenCalled();
    });
  });

  describe('markRead', () => {
    it('throws if missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.markRead('x', { id: 'u1', role: UserRole.STUDENT }),
      ).rejects.toThrow(NotFoundException);
    });

    it('forbids non-owner non-admin', async () => {
      repo.findById.mockResolvedValue({ id: 'n1', userId: 'u2', readAt: null });
      await expect(
        service.markRead('n1', { id: 'u1', role: UserRole.STUDENT }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('returns same notification if already read', async () => {
      const existing = { id: 'n1', userId: 'u1', readAt: new Date() };
      repo.findById.mockResolvedValue(existing);
      await expect(
        service.markRead('n1', { id: 'u1', role: UserRole.STUDENT }),
      ).resolves.toBe(existing);
      expect(repo.markRead).not.toHaveBeenCalled();
    });

    it('marks unread notifications as read', async () => {
      repo.findById.mockResolvedValue({ id: 'n1', userId: 'u1', readAt: null });
      repo.markRead.mockResolvedValue({ id: 'n1', readAt: new Date() });
      await service.markRead('n1', { id: 'u1', role: UserRole.STUDENT });
      expect(repo.markRead).toHaveBeenCalledWith('n1');
    });
  });

  it('markAllRead delegates to repo', async () => {
    repo.markAllRead.mockResolvedValue({ count: 3 });
    await expect(
      service.markAllRead({ id: 'u1', role: UserRole.STUDENT }),
    ).resolves.toEqual({ count: 3 });
  });

  describe('remove', () => {
    it('forbids non-owner non-admin', async () => {
      repo.findById.mockResolvedValue({ id: 'n1', userId: 'u2' });
      await expect(
        service.remove('n1', { id: 'u1', role: UserRole.STUDENT }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('soft-deletes own notification', async () => {
      repo.findById.mockResolvedValue({ id: 'n1', userId: 'u1' });
      repo.softDelete.mockResolvedValue({ id: 'n1' });
      await expect(
        service.remove('n1', { id: 'u1', role: UserRole.STUDENT }),
      ).resolves.toEqual({ id: 'n1', deleted: true });
    });
  });
});
