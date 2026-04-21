import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { CurriculumService } from '../curriculum.service';

describe('CurriculumService', () => {
  let service: CurriculumService;
  const courseFindUnique = jest.fn();
  const prismaStub = { course: { findUnique: courseFindUnique } } as unknown as PrismaService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [CurriculumService, { provide: PrismaService, useValue: prismaStub }],
    }).compile();
    service = moduleRef.get(CurriculumService);
  });

  afterEach(() => jest.clearAllMocks());

  it('throws NotFound when course missing', async () => {
    courseFindUnique.mockResolvedValue(null);
    await expect(service.getCurriculumByCourseId('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('shapes the curriculum tree', async () => {
    courseFindUnique.mockResolvedValue({
      id: 'c1',
      slug: 'ai',
      title: 'AI',
      units: [
        {
          id: 'u1',
          moduleNumber: 1,
          title: 'Unit 1',
          description: 'desc',
          durationLabel: '1h',
          status: 'COMPLETED',
          isLocked: false,
          chapters: [
            {
              id: 'ch1',
              title: 'Ch 1',
              description: 'd',
              position: 1,
              durationLabel: '30m',
              totalLessons: 1,
              lessons: [
                {
                  id: 'l1',
                  title: 'Lesson 1',
                  type: 'LESSON',
                  durationLabel: '30:00',
                  position: 1,
                },
              ],
            },
          ],
          resources: [
            { id: 'r1', name: 'r', kind: 'PDF', url: null, sizeLabel: '1MB' },
          ],
        },
      ],
    });
    const tree = await service.getCurriculumByCourseId('c1');
    expect(tree.units).toHaveLength(1);
    expect(tree.units[0].chapters[0].lessons[0].title).toBe('Lesson 1');
    expect(tree.units[0].resources[0].name).toBe('r');
  });
});
