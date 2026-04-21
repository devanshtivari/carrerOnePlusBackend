import { Test, TestingModule } from '@nestjs/testing';
import { ResourceKind, User, UserRole } from '@prisma/client';

import { ResourcesController } from '../resources.controller';
import { ResourcesService } from '../resources.service';

describe('ResourcesController', () => {
  let controller: ResourcesController;
  const service = {
    listByUnit: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ResourcesController],
      providers: [{ provide: ResourcesService, useValue: service }],
    }).compile();
    controller = moduleRef.get(ResourcesController);
  });

  afterEach(() => jest.clearAllMocks());

  const user = { id: 'admin', role: UserRole.ADMIN } as User;

  it('listByUnit delegates', async () => {
    service.listByUnit.mockResolvedValue([]);
    await controller.listByUnit('u1');
    expect(service.listByUnit).toHaveBeenCalledWith('u1');
  });
  it('findById delegates', async () => {
    service.findById.mockResolvedValue({ id: 'r1' });
    await controller.findById('r1');
    expect(service.findById).toHaveBeenCalledWith('r1');
  });
  it('create delegates', async () => {
    service.create.mockResolvedValue({ id: 'r1' });
    await controller.create({ unitId: 'u1', name: 'x', kind: ResourceKind.PDF } as any, user);
    expect(service.create).toHaveBeenCalled();
  });
  it('update delegates', async () => {
    service.update.mockResolvedValue({ id: 'r1' });
    await controller.update('r1', { name: 'x' } as any, user);
    expect(service.update).toHaveBeenCalled();
  });
  it('remove delegates', async () => {
    service.remove.mockResolvedValue({ id: 'r1', deleted: true });
    await expect(controller.remove('r1', user)).resolves.toEqual({ id: 'r1', deleted: true });
  });
});
