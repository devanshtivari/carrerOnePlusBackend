import { Test, TestingModule } from '@nestjs/testing';
import { User, UserRole } from '@prisma/client';

import { EnrollmentsController } from '../enrollments/enrollments.controller';
import { EnrollmentsService } from '../enrollments/enrollments.service';

describe('EnrollmentsController', () => {
  let controller: EnrollmentsController;
  const service = {
    list: jest.fn(),
    findById: jest.fn(),
    enroll: jest.fn(),
    touchLastAccess: jest.fn(),
    withdraw: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [EnrollmentsController],
      providers: [{ provide: EnrollmentsService, useValue: service }],
    }).compile();
    controller = moduleRef.get(EnrollmentsController);
  });

  afterEach(() => jest.clearAllMocks());

  const user = { id: 'me', role: UserRole.STUDENT } as User;

  it('list delegates with actor', async () => {
    service.list.mockResolvedValue({ items: [], total: 0 });
    await controller.list({} as any, user);
    expect(service.list).toHaveBeenCalledWith({}, { id: 'me', role: UserRole.STUDENT });
  });
  it('findById delegates', async () => {
    service.findById.mockResolvedValue({ id: 'e1' });
    await controller.findById('e1', user);
    expect(service.findById).toHaveBeenCalledWith('e1', { id: 'me', role: UserRole.STUDENT });
  });
  it('enroll delegates', async () => {
    service.enroll.mockResolvedValue({ id: 'e1' });
    await controller.enroll({ courseId: 'c1' } as any, user);
    expect(service.enroll).toHaveBeenCalled();
  });
  it('touch delegates', async () => {
    service.touchLastAccess.mockResolvedValue({ id: 'e1' });
    await controller.touch('e1', user);
    expect(service.touchLastAccess).toHaveBeenCalledWith('e1', { id: 'me', role: UserRole.STUDENT });
  });
  it('withdraw delegates', async () => {
    service.withdraw.mockResolvedValue({ id: 'e1', deleted: true });
    await expect(controller.withdraw('e1', user)).resolves.toEqual({ id: 'e1', deleted: true });
  });
});
