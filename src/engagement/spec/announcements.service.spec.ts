import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AnnouncementAudience, UserRole } from '@prisma/client';

import { AnnouncementsRepository } from '../announcements.repository';
import { AnnouncementsService } from '../announcements.service';

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;
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
        AnnouncementsService,
        { provide: AnnouncementsRepository, useValue: repo },
      ],
    }).compile();
    service = moduleRef.get(AnnouncementsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('paginates and applies audience filter', async () => {
      repo.findAll.mockResolvedValue({ items: [{ id: 'a1' }], total: 1 });
      const res = await service.list(
        { page: 1, pageSize: 10, isActive: true } as any,
        AnnouncementAudience.STUDENT,
      );
      expect(res.items).toHaveLength(1);
      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 0,
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('clamps invalid pagination', async () => {
      repo.findAll.mockResolvedValue({ items: [], total: 0 });
      await service.list({ page: 0, pageSize: 999 } as any);
      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 100 }),
      );
    });
  });

  describe('findById', () => {
    it('throws when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });

    it('returns the announcement', async () => {
      repo.findById.mockResolvedValue({ id: 'a1' });
      await expect(service.findById('a1')).resolves.toEqual({ id: 'a1' });
    });
  });

  describe('create', () => {
    it('connects author and applies defaults', async () => {
      repo.create.mockResolvedValue({ id: 'new' });
      await service.create(
        { title: 'Hello' } as any,
        { id: 'u1', role: UserRole.ADMIN },
      );
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Hello',
          audience: AnnouncementAudience.ALL,
          isActive: true,
          author: { connect: { id: 'u1' } },
        }),
      );
    });
  });

  describe('update', () => {
    it('errors when target missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('a1', { title: 'x' })).rejects.toThrow(NotFoundException);
    });

    it('only patches provided fields', async () => {
      repo.findById.mockResolvedValue({ id: 'a1' });
      repo.update.mockResolvedValue({ id: 'a1', title: 'x' });
      await service.update('a1', { title: 'x', expiresAt: undefined });
      expect(repo.update).toHaveBeenCalledWith('a1', { title: 'x' });
    });

    it('clears expiresAt when explicitly null-ish', async () => {
      repo.findById.mockResolvedValue({ id: 'a1' });
      repo.update.mockResolvedValue({ id: 'a1' });
      await service.update('a1', { expiresAt: '' as any });
      expect(repo.update).toHaveBeenCalledWith('a1', { expiresAt: null });
    });
  });

  describe('remove', () => {
    it('soft-deletes', async () => {
      repo.findById.mockResolvedValue({ id: 'a1' });
      repo.softDelete.mockResolvedValue({ id: 'a1' });
      await expect(service.remove('a1')).resolves.toEqual({ id: 'a1', deleted: true });
    });
  });
});
