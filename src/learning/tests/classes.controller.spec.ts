import { Test, TestingModule } from '@nestjs/testing';
import { User, UserRole } from '@prisma/client';

import { ClassesController } from '../classes/classes.controller';
import { ClassesService } from '../classes/classes.service';

describe('ClassesController', () => {
  let controller: ClassesController;
  const service = {
    list: jest.fn(),
    listMine: jest.fn(),
    findByCode: jest.fn(),
    findById: jest.fn(),
    listMembers: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addMember: jest.fn(),
    removeMember: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ClassesController],
      providers: [{ provide: ClassesService, useValue: service }],
    }).compile();
    controller = moduleRef.get(ClassesController);
  });

  afterEach(() => jest.clearAllMocks());

  const user = { id: 'me', role: UserRole.ADMIN } as User;

  it('list', async () => {
    service.list.mockResolvedValue({ items: [], total: 0 });
    await controller.list({} as any, user);
    expect(service.list).toHaveBeenCalled();
  });
  it('me', async () => {
    service.listMine.mockResolvedValue([]);
    await controller.myMemberships(user);
    expect(service.listMine).toHaveBeenCalled();
  });
  it('findByCode', async () => {
    service.findByCode.mockResolvedValue({});
    await controller.findByCode('a', user);
    expect(service.findByCode).toHaveBeenCalledWith('a', { id: 'me', role: UserRole.ADMIN });
  });
  it('findById', async () => {
    service.findById.mockResolvedValue({});
    await controller.findById('id', user);
    expect(service.findById).toHaveBeenCalled();
  });
  it('listMembers', async () => {
    service.listMembers.mockResolvedValue([]);
    await controller.listMembers('id', user);
    expect(service.listMembers).toHaveBeenCalled();
  });
  it('create', async () => {
    service.create.mockResolvedValue({});
    await controller.create({ code: 'a', name: 'A' } as any);
    expect(service.create).toHaveBeenCalled();
  });
  it('update', async () => {
    service.update.mockResolvedValue({});
    await controller.update('id', {} as any);
    expect(service.update).toHaveBeenCalledWith('id', {});
  });
  it('remove', async () => {
    service.remove.mockResolvedValue({ id: 'id', deleted: true });
    await expect(controller.remove('id')).resolves.toEqual({ id: 'id', deleted: true });
  });
  it('addMember', async () => {
    service.addMember.mockResolvedValue({});
    await controller.addMember('id', { userId: 'u' } as any, user);
    expect(service.addMember).toHaveBeenCalled();
  });
  it('removeMember', async () => {
    service.removeMember.mockResolvedValue({ id: 'm', deleted: true });
    await expect(controller.removeMember('m', user)).resolves.toEqual({ id: 'm', deleted: true });
  });
});
