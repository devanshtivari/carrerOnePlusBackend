import { Test, TestingModule } from '@nestjs/testing';
import { LessonType, User, UserRole } from '@prisma/client';

import { LessonsController } from '../lessons.controller';
import { LessonsService } from '../lessons.service';

describe('LessonsController', () => {
  let controller: LessonsController;
  const service = {
    listByChapter: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [LessonsController],
      providers: [{ provide: LessonsService, useValue: service }],
    }).compile();
    controller = moduleRef.get(LessonsController);
  });

  afterEach(() => jest.clearAllMocks());

  const user = { id: 'me', role: UserRole.INSTRUCTOR } as User;

  it('listByChapter delegates', async () => {
    service.listByChapter.mockResolvedValue([]);
    await controller.listByChapter('ch1');
    expect(service.listByChapter).toHaveBeenCalledWith('ch1');
  });
  it('findById delegates', async () => {
    service.findById.mockResolvedValue({ id: 'l1' });
    await controller.findById('l1');
    expect(service.findById).toHaveBeenCalledWith('l1');
  });
  it('create delegates', async () => {
    service.create.mockResolvedValue({ id: 'new' });
    await controller.create(
      { chapterId: 'ch1', title: 't', position: 1, type: LessonType.LESSON } as any,
      user,
    );
    expect(service.create).toHaveBeenCalled();
  });
  it('update delegates', async () => {
    service.update.mockResolvedValue({ id: 'l1' });
    await controller.update('l1', { title: 'x' } as any, user);
    expect(service.update).toHaveBeenCalled();
  });
  it('remove delegates', async () => {
    service.remove.mockResolvedValue({ id: 'l1', deleted: true });
    await expect(controller.remove('l1', user)).resolves.toEqual({ id: 'l1', deleted: true });
  });
});
