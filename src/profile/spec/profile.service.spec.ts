import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';

import { ProfileRepository } from '../profile.repository';
import { ProfileService } from '../profile.service';

describe('ProfileService', () => {
  let service: ProfileService;
  const repo = {
    findById: jest.fn(),
    update: jest.fn(),
    listStaff: jest.fn(),
    listStudents: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [ProfileService, { provide: ProfileRepository, useValue: repo }],
    }).compile();
    service = moduleRef.get(ProfileService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getMe', () => {
    it('throws when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.getMe({ id: 'me', role: UserRole.STUDENT }),
      ).rejects.toThrow(NotFoundException);
    });
    it('returns profile', async () => {
      repo.findById.mockResolvedValue({ id: 'me' });
      await expect(
        service.getMe({ id: 'me', role: UserRole.STUDENT }),
      ).resolves.toEqual({ id: 'me' });
    });
  });

  describe('updateMe', () => {
    it('patches and returns refreshed profile', async () => {
      repo.findById.mockResolvedValue({ id: 'me', bio: 'new' });
      repo.update.mockResolvedValue({ id: 'me' });
      const res = await service.updateMe(
        { id: 'me', role: UserRole.STUDENT },
        { bio: 'new', age: 12 },
      );
      expect(repo.update).toHaveBeenCalledWith('me', { bio: 'new', age: 12 });
      expect(res).toEqual({ id: 'me', bio: 'new' });
    });
  });

  describe('findById', () => {
    it('throws when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.findById('x', { id: 'me', role: UserRole.STUDENT }),
      ).rejects.toThrow(NotFoundException);
    });

    it('forbids student viewing other student', async () => {
      repo.findById.mockResolvedValue({ id: 'other' });
      await expect(
        service.findById('other', { id: 'me', role: UserRole.STUDENT }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('admin can view anyone', async () => {
      repo.findById.mockResolvedValue({ id: 'other' });
      await expect(
        service.findById('other', { id: 'admin', role: UserRole.ADMIN }),
      ).resolves.toEqual({ id: 'other' });
    });
  });

  describe('listStaff / listStudents', () => {
    it('paginates staff', async () => {
      repo.listStaff.mockResolvedValue({ items: [], total: 0 });
      const res = await service.listStaff(2, 10);
      expect(repo.listStaff).toHaveBeenCalledWith(10, 10);
      expect(res.page).toBe(2);
    });

    it('paginates students', async () => {
      repo.listStudents.mockResolvedValue({ items: [], total: 5 });
      const res = await service.listStudents(1, 5);
      expect(res.total).toBe(5);
    });
  });
});
