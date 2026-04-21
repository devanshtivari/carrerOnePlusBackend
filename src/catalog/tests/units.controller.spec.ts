import { Test, TestingModule } from '@nestjs/testing';
import { User, UserRole } from '@prisma/client';

import { UnitsController } from '../units.controller';
import { UnitsService } from '../units.service';

describe('UnitsController', () => {
  let controller: UnitsController;
  const service = {
    listByCourse: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [UnitsController],
      providers: [{ provide: UnitsService, useValue: service }],
    }).compile();
    controller = moduleRef.get(UnitsController);
  });

  afterEach(() => jest.clearAllMocks());

  it('listByCourse delegates', async () => {
    service.listByCourse.mockResolvedValue([]);
    await controller.listByCourse('c1');
    expect(service.listByCourse).toHaveBeenCalledWith('c1');
  });
  it('findById delegates', async () => {
    service.findById.mockResolvedValue({ id: 'u1' });
    await controller.findById('u1');
    expect(service.findById).toHaveBeenCalledWith('u1');
  });
  it('create injects actor context', async () => {
    service.create.mockResolvedValue({ id: 'new' });
    const user = { id: 'me', role: UserRole.INSTRUCTOR } as User;
    await controller.create({ courseId: 'c1', moduleNumber: 1, title: 't' } as any, user);
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ courseId: 'c1' }),
      { id: 'me', role: UserRole.INSTRUCTOR },
    );
  });
  it('update injects actor context', async () => {
    service.update.mockResolvedValue({ id: 'u1' });
    const user = { id: 'admin', role: UserRole.ADMIN } as User;
    await controller.update('u1', { title: 'x' } as any, user);
    expect(service.update).toHaveBeenCalledWith('u1', { title: 'x' }, { id: 'admin', role: UserRole.ADMIN });
  });
  it('remove injects actor context', async () => {
    service.remove.mockResolvedValue({ id: 'u1', deleted: true });
    const user = { id: 'me', role: UserRole.INSTRUCTOR } as User;
    await controller.remove('u1', user);
    expect(service.remove).toHaveBeenCalledWith('u1', { id: 'me', role: UserRole.INSTRUCTOR });
  });
});
