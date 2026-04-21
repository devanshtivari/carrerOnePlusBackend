import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { LabsController } from '../labs.controller';
import { LabsRepository } from '../labs.repository';
import { LabsService } from '../labs.service';

describe('LabsController + Repository', () => {
  let ctrl: LabsController;
  let repo: LabsRepository;
  const svc = {
    list: jest.fn().mockResolvedValue('list'),
    findById: jest.fn().mockResolvedValue('one'),
    create: jest.fn().mockResolvedValue('created'),
    update: jest.fn().mockResolvedValue('updated'),
    remove: jest.fn().mockResolvedValue('removed'),
  };
  const prisma = {
    lab: {
      create: jest.fn().mockResolvedValue({ id: 'l1' }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn().mockResolvedValue({ id: 'l1' }),
      update: jest.fn().mockResolvedValue({ id: 'l1' }),
      delete: jest.fn().mockResolvedValue({ id: 'l1' }),
    },
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [LabsController],
      providers: [
        { provide: LabsService, useValue: svc },
        LabsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    ctrl = moduleRef.get(LabsController);
    repo = moduleRef.get(LabsRepository);
  });

  afterEach(() => jest.clearAllMocks());

  it('controller endpoints delegate', async () => {
    await ctrl.list({} as any);
    await ctrl.findById('l1');
    await ctrl.create({} as any);
    await ctrl.update('l1', {} as any);
    await ctrl.remove('l1');
    expect(svc.list).toHaveBeenCalled();
    expect(svc.findById).toHaveBeenCalledWith('l1');
    expect(svc.create).toHaveBeenCalled();
    expect(svc.update).toHaveBeenCalled();
    expect(svc.remove).toHaveBeenCalledWith('l1');
  });

  it('repository delegates to prisma', async () => {
    await repo.create({} as any);
    await repo.findAll({ skip: 0, take: 10, where: {}, orderBy: {} });
    await repo.findById('l1');
    await repo.update('l1', {});
    await repo.softDelete('l1');
    expect(prisma.lab.create).toHaveBeenCalled();
    expect(prisma.lab.findMany).toHaveBeenCalled();
    expect(prisma.lab.findUnique).toHaveBeenCalled();
    expect(prisma.lab.update).toHaveBeenCalled();
    expect(prisma.lab.delete).toHaveBeenCalled();
  });
});
