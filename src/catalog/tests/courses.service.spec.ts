import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CourseLevel, UserRole } from '@prisma/client';

import { CategoriesRepository } from '../categories.repository';
import { CoursesRepository } from '../courses.repository';
import { CoursesService } from '../courses.service';

describe('CoursesService', () => {
  let service: CoursesService;

  const repo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findBySlug: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };
  const categoriesRepo = {
    findById: jest.fn(),
    findBySlug: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: CoursesRepository, useValue: repo },
        { provide: CategoriesRepository, useValue: categoriesRepo },
      ],
    }).compile();
    service = moduleRef.get(CoursesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('paginates and returns metadata', async () => {
      repo.findAll.mockResolvedValue({ items: [{ id: '1' }, { id: '2' }], total: 12 });
      const result = await service.list({ page: 2, pageSize: 5 } as any);
      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
      expect(result).toMatchObject({ total: 12, page: 2, pageSize: 5, totalPages: 3 });
    });

    it('returns empty result when category slug does not exist', async () => {
      categoriesRepo.findBySlug.mockResolvedValue(null);
      const result = await service.list({ category: 'unknown' } as any);
      expect(result.items).toEqual([]);
      expect(repo.findAll).not.toHaveBeenCalled();
    });

    it('builds search OR clause', async () => {
      repo.findAll.mockResolvedValue({ items: [], total: 0 });
      await service.list({ search: 'react' } as any);
      const args = repo.findAll.mock.calls[0][0];
      expect(args.where.OR).toEqual(
        expect.arrayContaining([
          { title: { contains: 'react', mode: 'insensitive' } },
          { description: { contains: 'react', mode: 'insensitive' } },
          { tags: { has: 'react' } },
        ]),
      );
    });
  });

  describe('findBySlug', () => {
    it('throws NotFound', async () => {
      repo.findBySlug.mockResolvedValue(null);
      await expect(service.findBySlug('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    it('rejects duplicate slug', async () => {
      repo.findBySlug.mockResolvedValue({ id: 'old' });
      await expect(
        service.create(
          { slug: 's', title: 't', description: 'long enough description' } as any,
          { id: 'admin', role: UserRole.ADMIN },
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('forbids instructor from assigning courses to a different user', async () => {
      repo.findBySlug.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: 'new' });
      await expect(
        service.create(
          {
            slug: 's',
            title: 't',
            description: 'long enough description',
            instructorId: 'someone-else',
          } as any,
          { id: 'me', role: UserRole.INSTRUCTOR },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('auto-assigns INSTRUCTOR ownership when no instructorId provided', async () => {
      repo.findBySlug.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: 'new' });
      await service.create(
        {
          slug: 's',
          title: 't',
          description: 'long enough description',
        } as any,
        { id: 'me', role: UserRole.INSTRUCTOR },
      );
      const data = repo.create.mock.calls[0][0];
      expect(data.instructor).toEqual({ connect: { id: 'me' } });
    });

    it('lets admin attach a different instructor', async () => {
      repo.findBySlug.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: 'new' });
      await service.create(
        {
          slug: 's',
          title: 't',
          description: 'long enough description',
          instructorId: 'inst-1',
          level: CourseLevel.BEGINNER,
        } as any,
        { id: 'admin', role: UserRole.ADMIN },
      );
      expect(repo.create).toHaveBeenCalled();
      const data = repo.create.mock.calls[0][0];
      expect(data.instructor).toEqual({ connect: { id: 'inst-1' } });
    });
  });

  describe('update', () => {
    it('blocks an instructor from updating someone else’s course', async () => {
      repo.findById.mockResolvedValue({ id: 'c1', instructorId: 'other' });
      await expect(
        service.update('c1', { title: 'new' } as any, { id: 'me', role: UserRole.INSTRUCTOR }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows admin to update', async () => {
      repo.findById.mockResolvedValue({ id: 'c1', instructorId: 'other', slug: 'old' });
      repo.update.mockResolvedValue({ id: 'c1', title: 'new' });
      await service.update('c1', { title: 'new' } as any, { id: 'admin', role: UserRole.ADMIN });
      expect(repo.update).toHaveBeenCalledWith('c1', { title: 'new' });
    });
  });

  describe('remove', () => {
    it('soft-deletes', async () => {
      repo.findById.mockResolvedValue({ id: 'c1', instructorId: 'me' });
      repo.softDelete.mockResolvedValue({ id: 'c1' });
      const result = await service.remove('c1', { id: 'me', role: UserRole.INSTRUCTOR });
      expect(repo.softDelete).toHaveBeenCalledWith('c1');
      expect(result).toEqual({ id: 'c1', deleted: true });
    });

    it('throws when course missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.remove('missing', { id: 'admin', role: UserRole.ADMIN }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('blocks instructor removing someone else’s course', async () => {
      repo.findById.mockResolvedValue({ id: 'c1', instructorId: 'other' });
      await expect(
        service.remove('c1', { id: 'me', role: UserRole.INSTRUCTOR }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('findById', () => {
    it('throws NotFound', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('returns course when found', async () => {
      repo.findById.mockResolvedValue({ id: 'c1' });
      await expect(service.findById('c1')).resolves.toMatchObject({ id: 'c1' });
    });
  });

  describe('list category fallback', () => {
    it('resolves category by slug', async () => {
      categoriesRepo.findBySlug.mockResolvedValue({ id: 'cat-1' });
      repo.findAll.mockResolvedValue({ items: [], total: 0 });
      await service.list({ category: 'web-dev' } as any);
      const args = repo.findAll.mock.calls[0][0];
      expect(args.where.categoryId).toBe('cat-1');
    });
  });

  describe('create with category + admin', () => {
    it('verifies the category exists', async () => {
      repo.findBySlug.mockResolvedValue(null);
      categoriesRepo.findById.mockResolvedValue(null);
      await expect(
        service.create(
          { slug: 's', title: 't', description: 'long enough', categoryId: 'bad' } as any,
          { id: 'admin', role: UserRole.ADMIN },
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
