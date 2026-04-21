import { Test, TestingModule } from '@nestjs/testing';

import { CategoriesController } from '../categories.controller';
import { CategoriesService } from '../categories.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  const service = {
    list: jest.fn(),
    findBySlug: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: service }],
    }).compile();
    controller = moduleRef.get(CategoriesController);
  });

  afterEach(() => jest.clearAllMocks());

  it('list delegates', async () => {
    service.list.mockResolvedValue([{ id: '1' }]);
    await expect(controller.list()).resolves.toEqual([{ id: '1' }]);
  });
  it('findBySlug delegates', async () => {
    service.findBySlug.mockResolvedValue({ slug: 'web-dev' });
    await expect(controller.findBySlug('web-dev')).resolves.toEqual({ slug: 'web-dev' });
  });
  it('create delegates', async () => {
    service.create.mockResolvedValue({ id: 'new' });
    await controller.create({ slug: 's', label: 'L', position: 0 } as any);
    expect(service.create).toHaveBeenCalled();
  });
  it('update delegates', async () => {
    service.update.mockResolvedValue({ id: 'a' });
    await controller.update('a', { label: 'X' } as any);
    expect(service.update).toHaveBeenCalledWith('a', { label: 'X' });
  });
  it('remove delegates', async () => {
    service.remove.mockResolvedValue({ id: 'a', deleted: true });
    await expect(controller.remove('a')).resolves.toEqual({ id: 'a', deleted: true });
  });
});
