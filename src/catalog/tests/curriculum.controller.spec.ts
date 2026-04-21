import { Test, TestingModule } from '@nestjs/testing';

import { CurriculumController } from '../curriculum.controller';
import { CurriculumService } from '../curriculum.service';

describe('CurriculumController', () => {
  let controller: CurriculumController;
  const service = {
    getCurriculumByCourseId: jest.fn(),
    getCurriculumBySlug: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [CurriculumController],
      providers: [{ provide: CurriculumService, useValue: service }],
    }).compile();
    controller = moduleRef.get(CurriculumController);
  });

  afterEach(() => jest.clearAllMocks());

  it('byId delegates', async () => {
    service.getCurriculumByCourseId.mockResolvedValue({ id: 'c1', slug: 's', title: 't', units: [] });
    await controller.byId('c1');
    expect(service.getCurriculumByCourseId).toHaveBeenCalledWith('c1');
  });
  it('bySlug delegates', async () => {
    service.getCurriculumBySlug.mockResolvedValue({ id: 'c1', slug: 's', title: 't', units: [] });
    await controller.bySlug('s');
    expect(service.getCurriculumBySlug).toHaveBeenCalledWith('s');
  });
});
