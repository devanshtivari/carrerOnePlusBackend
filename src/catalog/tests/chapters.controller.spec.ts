import { Test, TestingModule } from '@nestjs/testing';
import { User, UserRole } from '@prisma/client';

import { ChaptersController } from '../chapters.controller';
import { ChaptersService } from '../chapters.service';

describe('ChaptersController', () => {
  let controller: ChaptersController;
  const service = {
    listByUnit: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ChaptersController],
      providers: [{ provide: ChaptersService, useValue: service }],
    }).compile();
    controller = moduleRef.get(ChaptersController);
  });

  afterEach(() => jest.clearAllMocks());

  const user = { id: 'me', role: UserRole.INSTRUCTOR } as User;

  it('listByUnit delegates', async () => {
    service.listByUnit.mockResolvedValue([]);
    await controller.listByUnit('u1');
    expect(service.listByUnit).toHaveBeenCalledWith('u1');
  });
  it('findById delegates', async () => {
    service.findById.mockResolvedValue({ id: 'ch1' });
    await controller.findById('ch1');
    expect(service.findById).toHaveBeenCalledWith('ch1');
  });
  it('create delegates', async () => {
    service.create.mockResolvedValue({ id: 'new' });
    await controller.create({ unitId: 'u1', title: 't', position: 1 } as any, user);
    expect(service.create).toHaveBeenCalledWith(expect.any(Object), { id: 'me', role: UserRole.INSTRUCTOR });
  });
  it('update delegates', async () => {
    service.update.mockResolvedValue({ id: 'ch1' });
    await controller.update('ch1', { title: 'x' } as any, user);
    expect(service.update).toHaveBeenCalled();
  });
  it('remove delegates', async () => {
    service.remove.mockResolvedValue({ id: 'ch1', deleted: true });
    await expect(controller.remove('ch1', user)).resolves.toEqual({ id: 'ch1', deleted: true });
  });
});
