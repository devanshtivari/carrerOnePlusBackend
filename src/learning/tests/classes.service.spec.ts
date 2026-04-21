import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClassMembershipRole, UserRole } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ClassesRepository } from '../classes/classes.repository';
import { ClassesService } from '../classes/classes.service';

describe('ClassesService', () => {
  let service: ClassesService;
  const repo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    listMembers: jest.fn(),
    listMembershipsForUser: jest.fn(),
    findMembership: jest.fn(),
    addMember: jest.fn(),
    removeMembership: jest.fn(),
    findMembershipById: jest.fn(),
  };
  const prisma: any = {
    classMembership: { findFirst: jest.fn() },
    user: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        { provide: ClassesRepository, useValue: repo },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(ClassesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('limits non-admin to memberships', async () => {
      repo.findAll.mockResolvedValue({ items: [], total: 0 });
      await service.list({} as any, { id: 'me', role: UserRole.STUDENT });
      const args = repo.findAll.mock.calls[0][0];
      expect(args.where.memberships).toEqual({ some: { userId: 'me' } });
    });
    it('admin sees all + applies search OR', async () => {
      repo.findAll.mockResolvedValue({ items: [], total: 0 });
      await service.list({ search: 'grade' } as any, { id: 'admin', role: UserRole.ADMIN });
      const args = repo.findAll.mock.calls[0][0];
      expect(args.where.OR).toBeDefined();
      expect(args.where.memberships).toBeUndefined();
    });
  });

  describe('findById / findByCode', () => {
    it('throws when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.findById('x', { id: 'me', role: UserRole.STUDENT }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
    it('blocks non-member non-admin', async () => {
      repo.findById.mockResolvedValue({ id: 'cls1' });
      prisma.classMembership.findFirst.mockResolvedValue(null);
      await expect(
        service.findById('cls1', { id: 'me', role: UserRole.STUDENT }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('allows admin', async () => {
      repo.findById.mockResolvedValue({ id: 'cls1' });
      await expect(
        service.findById('cls1', { id: 'admin', role: UserRole.ADMIN }),
      ).resolves.toMatchObject({ id: 'cls1' });
    });
    it('findByCode throws when missing', async () => {
      repo.findByCode.mockResolvedValue(null);
      await expect(
        service.findByCode('xx', { id: 'admin', role: UserRole.ADMIN }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create / update / remove', () => {
    it('rejects duplicate code on create', async () => {
      repo.findByCode.mockResolvedValue({ id: 'old' });
      await expect(
        service.create({ code: 'a', name: 'A' } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
    it('creates when free', async () => {
      repo.findByCode.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: 'cls1' });
      await service.create({ code: 'a', name: 'A' } as any);
      expect(repo.create).toHaveBeenCalled();
    });
    it('update throws when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('x', {} as any)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('update rejects code conflict', async () => {
      repo.findById.mockResolvedValue({ id: 'cls1', code: 'a' });
      repo.findByCode.mockResolvedValue({ id: 'cls2' });
      await expect(
        service.update('cls1', { code: 'b' } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
    it('update applies fields', async () => {
      repo.findById.mockResolvedValue({ id: 'cls1', code: 'a' });
      repo.findByCode.mockResolvedValue(null);
      repo.update.mockResolvedValue({ id: 'cls1' });
      await service.update('cls1', { name: 'New' } as any);
      expect(repo.update).toHaveBeenCalled();
    });
    it('remove soft-deletes', async () => {
      repo.findById.mockResolvedValue({ id: 'cls1' });
      repo.softDelete.mockResolvedValue({ id: 'cls1' });
      await expect(service.remove('cls1')).resolves.toEqual({ id: 'cls1', deleted: true });
    });
    it('remove throws when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.remove('x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('membership', () => {
    it('listMembers requires read access', async () => {
      prisma.classMembership.findFirst.mockResolvedValue(null);
      await expect(
        service.listMembers('cls1', { id: 'me', role: UserRole.STUDENT }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('listMembers returns members for member', async () => {
      prisma.classMembership.findFirst.mockResolvedValue({ id: 'm1' });
      repo.listMembers.mockResolvedValue([{ id: 'm1' }]);
      await expect(
        service.listMembers('cls1', { id: 'me', role: UserRole.STUDENT }),
      ).resolves.toHaveLength(1);
    });
    it('listMine returns memberships', async () => {
      repo.listMembershipsForUser.mockResolvedValue([{ id: 'm1' }]);
      await expect(
        service.listMine({ id: 'me', role: UserRole.STUDENT }),
      ).resolves.toHaveLength(1);
    });

    describe('addMember', () => {
      it('throws if class missing', async () => {
        repo.findById.mockResolvedValue(null);
        await expect(
          service.addMember('cls1', { userId: 'u1' } as any, {
            id: 'admin',
            role: UserRole.ADMIN,
          }),
        ).rejects.toBeInstanceOf(NotFoundException);
      });
      it('blocks non-teacher non-admin', async () => {
        repo.findById.mockResolvedValue({ id: 'cls1' });
        prisma.classMembership.findFirst.mockResolvedValue(null);
        await expect(
          service.addMember('cls1', { userId: 'u1' } as any, {
            id: 'me',
            role: UserRole.STUDENT,
          }),
        ).rejects.toBeInstanceOf(ForbiddenException);
      });
      it('throws when user missing', async () => {
        repo.findById.mockResolvedValue({ id: 'cls1' });
        prisma.user.findUnique.mockResolvedValue(null);
        await expect(
          service.addMember('cls1', { userId: 'u1' } as any, {
            id: 'admin',
            role: UserRole.ADMIN,
          }),
        ).rejects.toBeInstanceOf(NotFoundException);
      });
      it('rejects duplicate role', async () => {
        repo.findById.mockResolvedValue({ id: 'cls1' });
        prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
        repo.findMembership.mockResolvedValue({ id: 'mem1' });
        await expect(
          service.addMember('cls1', { userId: 'u1' } as any, {
            id: 'admin',
            role: UserRole.ADMIN,
          }),
        ).rejects.toBeInstanceOf(ConflictException);
      });
      it('creates membership', async () => {
        repo.findById.mockResolvedValue({ id: 'cls1' });
        prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
        repo.findMembership.mockResolvedValue(null);
        repo.addMember.mockResolvedValue({ id: 'mem1' });
        await service.addMember('cls1', { userId: 'u1', role: ClassMembershipRole.STUDENT } as any, {
          id: 'admin',
          role: UserRole.ADMIN,
        });
        expect(repo.addMember).toHaveBeenCalled();
      });
      it('teacher member can add', async () => {
        repo.findById.mockResolvedValue({ id: 'cls1' });
        prisma.classMembership.findFirst.mockResolvedValue({ id: 'mem-teacher' });
        prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
        repo.findMembership.mockResolvedValue(null);
        repo.addMember.mockResolvedValue({ id: 'mem1' });
        await service.addMember('cls1', { userId: 'u1' } as any, {
          id: 'teacher',
          role: UserRole.INSTRUCTOR,
        });
        expect(repo.addMember).toHaveBeenCalled();
      });
    });

    describe('removeMember', () => {
      it('throws when missing', async () => {
        repo.findMembershipById.mockResolvedValue(null);
        await expect(
          service.removeMember('m1', { id: 'admin', role: UserRole.ADMIN }),
        ).rejects.toBeInstanceOf(NotFoundException);
      });
      it('removes for admin', async () => {
        repo.findMembershipById.mockResolvedValue({ id: 'm1', classId: 'cls1' });
        repo.removeMembership.mockResolvedValue({ id: 'm1' });
        await expect(
          service.removeMember('m1', { id: 'admin', role: UserRole.ADMIN }),
        ).resolves.toEqual({ id: 'm1', deleted: true });
      });
    });
  });
});
