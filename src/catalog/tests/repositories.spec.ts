import { Test, TestingModule } from '@nestjs/testing';

import { CategoriesRepository } from '../categories.repository';
import { ChaptersRepository } from '../chapters.repository';
import { CoursesRepository } from '../courses.repository';
import { LessonsRepository } from '../lessons.repository';
import { ResourcesRepository } from '../resources.repository';
import { UnitsRepository } from '../units.repository';
import { PrismaService } from '../../prisma/prisma.service';

function makePrismaMock() {
  const fns = () => ({
    create: jest.fn().mockResolvedValue({ id: 'x' }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue({ id: 'x' }),
    findFirst: jest.fn().mockResolvedValue({ id: 'x' }),
    update: jest.fn().mockResolvedValue({ id: 'x' }),
    delete: jest.fn().mockResolvedValue({ id: 'x' }),
    count: jest.fn().mockResolvedValue(1),
  });
  return {
    category: fns(),
    course: fns(),
    unit: fns(),
    chapter: fns(),
    lesson: fns(),
    resource: fns(),
    $transaction: jest.fn(async (calls: any[]) => Promise.all(calls.map((c) => c))),
  };
}

describe('Catalog repositories', () => {
  let prisma: any;
  let categories: CategoriesRepository;
  let courses: CoursesRepository;
  let units: UnitsRepository;
  let chapters: ChaptersRepository;
  let lessons: LessonsRepository;
  let resources: ResourcesRepository;

  beforeEach(async () => {
    prisma = makePrismaMock();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesRepository,
        CoursesRepository,
        UnitsRepository,
        ChaptersRepository,
        LessonsRepository,
        ResourcesRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    categories = moduleRef.get(CategoriesRepository);
    courses = moduleRef.get(CoursesRepository);
    units = moduleRef.get(UnitsRepository);
    chapters = moduleRef.get(ChaptersRepository);
    lessons = moduleRef.get(LessonsRepository);
    resources = moduleRef.get(ResourcesRepository);
  });

  describe('CategoriesRepository', () => {
    it('CRUD delegates to prisma.category', async () => {
      await categories.create({ slug: 's', label: 'L', position: 1 } as any);
      await categories.findAll();
      await categories.findById('id');
      await categories.findBySlug('s');
      await categories.update('id', { label: 'New' });
      await categories.softDelete('id');
      expect(prisma.category.create).toHaveBeenCalled();
      expect(prisma.category.findMany).toHaveBeenCalled();
      expect(prisma.category.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.category.update).toHaveBeenCalled();
      expect(prisma.category.delete).toHaveBeenCalled();
    });
  });

  describe('CoursesRepository', () => {
    it('findAll returns items + total', async () => {
      prisma.course.findMany.mockResolvedValue([{ id: 'c1' }]);
      prisma.course.count.mockResolvedValue(1);
      const result = await courses.findAll({ skip: 0, take: 10, where: {}, orderBy: {} });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
    it('finders/CRUD delegate', async () => {
      await courses.findById('id');
      await courses.findBySlug('s');
      await courses.create({} as any);
      await courses.update('id', {});
      await courses.softDelete('id');
      expect(prisma.course.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.course.create).toHaveBeenCalled();
      expect(prisma.course.update).toHaveBeenCalled();
      expect(prisma.course.delete).toHaveBeenCalled();
    });
  });

  describe('UnitsRepository', () => {
    it('CRUD delegates', async () => {
      await units.findAllByCourse('c');
      await units.findById('id');
      await units.findByCourseAndModule('c', 1);
      await units.create({} as any);
      await units.update('id', {});
      await units.softDelete('id');
      expect(prisma.unit.findMany).toHaveBeenCalled();
      expect(prisma.unit.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.unit.create).toHaveBeenCalled();
      expect(prisma.unit.update).toHaveBeenCalled();
      expect(prisma.unit.delete).toHaveBeenCalled();
    });
  });

  describe('ChaptersRepository', () => {
    it('CRUD delegates', async () => {
      await chapters.findAllByUnit('u');
      await chapters.findById('id');
      await chapters.findByUnitAndPosition('u', 1);
      await chapters.create({} as any);
      await chapters.update('id', {});
      await chapters.softDelete('id');
      expect(prisma.chapter.findMany).toHaveBeenCalled();
      expect(prisma.chapter.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe('LessonsRepository', () => {
    it('CRUD delegates', async () => {
      await lessons.findAllByChapter('ch');
      await lessons.findById('id');
      await lessons.findByChapterAndPosition('ch', 1);
      await lessons.create({} as any);
      await lessons.update('id', {});
      await lessons.softDelete('id');
      expect(prisma.lesson.findMany).toHaveBeenCalled();
      expect(prisma.lesson.findUnique).toHaveBeenCalled();
    });
  });

  describe('ResourcesRepository', () => {
    it('CRUD delegates', async () => {
      await resources.findAllByUnit('u');
      await resources.findById('id');
      await resources.create({} as any);
      await resources.update('id', {});
      await resources.softDelete('id');
      expect(prisma.resource.findMany).toHaveBeenCalled();
      expect(prisma.resource.findUnique).toHaveBeenCalled();
    });
  });
});
