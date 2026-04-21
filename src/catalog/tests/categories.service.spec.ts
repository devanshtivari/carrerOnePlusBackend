import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CategoriesRepository } from '../categories.repository';
import { CategoriesService } from '../categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const repo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findBySlug: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: CategoriesRepository, useValue: repo },
      ],
    }).compile();
    service = moduleRef.get(CategoriesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('returns repository rows', async () => {
      repo.findAll.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
      const result = await service.list();
      expect(result).toHaveLength(2);
    });
  });

  describe('findBySlug', () => {
    it('throws when missing', async () => {
      repo.findBySlug.mockResolvedValue(null);
      await expect(service.findBySlug('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('returns category when found', async () => {
      repo.findBySlug.mockResolvedValue({ id: '1', slug: 'web-dev' });
      await expect(service.findBySlug('web-dev')).resolves.toMatchObject({ slug: 'web-dev' });
    });
  });

  describe('create', () => {
    it('rejects duplicate slug', async () => {
      repo.findBySlug.mockResolvedValue({ id: 'existing' });
      await expect(
        service.create({ slug: 'web-dev', label: 'Web Dev', position: 0 }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
    it('creates a new category', async () => {
      repo.findBySlug.mockResolvedValue(null);
      repo.create.mockImplementation((data) => Promise.resolve({ id: 'new', ...data }));
      const result = await service.create({ slug: 'web-dev', label: 'Web Dev', position: 1 });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'web-dev', label: 'Web Dev', position: 1 }),
      );
      expect(result.id).toBe('new');
    });
  });

  describe('update', () => {
    it('throws when category does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('nope', { label: 'X' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
    it('rejects slug collision with a different row', async () => {
      repo.findById.mockResolvedValue({ id: 'a' });
      repo.findBySlug.mockResolvedValue({ id: 'b', slug: 'taken' });
      await expect(service.update('a', { slug: 'taken' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
    it('passes through allowed fields', async () => {
      repo.findById.mockResolvedValue({ id: 'a' });
      repo.findBySlug.mockResolvedValue(null);
      repo.update.mockResolvedValue({ id: 'a', label: 'New' });
      await service.update('a', { label: 'New', position: 5 });
      expect(repo.update).toHaveBeenCalledWith('a', { label: 'New', position: 5 });
    });
  });

  describe('remove', () => {
    it('soft-deletes after existence check', async () => {
      repo.findById.mockResolvedValue({ id: 'a' });
      repo.softDelete.mockResolvedValue({ id: 'a' });
      const result = await service.remove('a');
      expect(repo.softDelete).toHaveBeenCalledWith('a');
      expect(result).toEqual({ id: 'a', deleted: true });
    });
  });
});
