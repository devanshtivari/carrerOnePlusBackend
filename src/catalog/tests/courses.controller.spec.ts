import { Test, TestingModule } from '@nestjs/testing';
import { User, UserRole } from '@prisma/client';

import { CoursesController } from '../courses.controller';
import { CoursesService } from '../courses.service';

describe('CoursesController', () => {
  let controller: CoursesController;
  const mockService = {
    list: jest.fn(),
    findById: jest.fn(),
    findBySlug: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [{ provide: CoursesService, useValue: mockService }],
    }).compile();
    controller = moduleRef.get(CoursesController);
  });

  afterEach(() => jest.clearAllMocks());

  it('list passes through query DTO', async () => {
    mockService.list.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 });
    const query = { page: 1, pageSize: 20 } as any;
    await controller.list(query);
    expect(mockService.list).toHaveBeenCalledWith(query);
  });

  it('findBySlug delegates to service', async () => {
    mockService.findBySlug.mockResolvedValue({ slug: 'react' });
    await controller.findBySlug('react');
    expect(mockService.findBySlug).toHaveBeenCalledWith('react');
  });

  it('create injects actor context from JWT user', async () => {
    mockService.create.mockResolvedValue({ id: 'new' });
    const user = { id: 'me', role: UserRole.INSTRUCTOR } as User;
    await controller.create({ slug: 's', title: 't', description: 'long enough' } as any, user);
    expect(mockService.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 's' }),
      { id: 'me', role: UserRole.INSTRUCTOR },
    );
  });

  it('remove delegates with actor context', async () => {
    mockService.remove.mockResolvedValue({ id: 'c1', deleted: true });
    const user = { id: 'admin', role: UserRole.ADMIN } as User;
    const result = await controller.remove('c1', user);
    expect(mockService.remove).toHaveBeenCalledWith('c1', { id: 'admin', role: UserRole.ADMIN });
    expect(result).toEqual({ id: 'c1', deleted: true });
  });
});
