import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ProfileController } from '../profile.controller';
import { ProfileRepository } from '../profile.repository';
import { ProfileService } from '../profile.service';

const user = { id: 'u1', role: UserRole.STUDENT } as any;

describe('ProfileController + Repository', () => {
  let ctrl: ProfileController;
  let repo: ProfileRepository;
  const svc = {
    getMe: jest.fn().mockResolvedValue('me'),
    updateMe: jest.fn().mockResolvedValue('updated'),
    listStaff: jest.fn().mockResolvedValue('staff'),
    listStudents: jest.fn().mockResolvedValue('students'),
    findById: jest.fn().mockResolvedValue('one'),
  };
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'u1' }),
      update: jest.fn().mockResolvedValue({ id: 'u1' }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        { provide: ProfileService, useValue: svc },
        ProfileRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    ctrl = moduleRef.get(ProfileController);
    repo = moduleRef.get(ProfileRepository);
  });

  afterEach(() => jest.clearAllMocks());

  it('controller endpoints delegate', async () => {
    await ctrl.me(user);
    await ctrl.updateMe(user, {} as any);
    await ctrl.listStaff({} as any);
    await ctrl.listStudents({} as any);
    await ctrl.findById('u2', user);
    expect(svc.getMe).toHaveBeenCalled();
    expect(svc.updateMe).toHaveBeenCalled();
    expect(svc.listStaff).toHaveBeenCalled();
    expect(svc.listStudents).toHaveBeenCalled();
    expect(svc.findById).toHaveBeenCalled();
  });

  it('repository delegates to prisma', async () => {
    await repo.findById('u1');
    await repo.update('u1', { fullName: 'X' });
    await repo.listStaff(0, 10);
    await repo.listStudents(0, 10);
    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalled();
    expect(prisma.user.findMany).toHaveBeenCalledTimes(2);
    expect(prisma.user.count).toHaveBeenCalledTimes(2);
  });
});
