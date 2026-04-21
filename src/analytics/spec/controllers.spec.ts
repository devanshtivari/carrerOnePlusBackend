import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { DashboardController } from '../dashboard.controller';
import { DashboardService } from '../dashboard.service';
import { ReportsController } from '../reports.controller';
import { ReportsRepository } from '../reports.repository';
import { ReportsService } from '../reports.service';
import { ResultsController } from '../results.controller';
import { ResultsRepository } from '../results.repository';
import { ResultsService } from '../results.service';

const user = { id: 'u1', role: UserRole.INSTRUCTOR } as any;

describe('DashboardController', () => {
  let ctrl: DashboardController;
  const svc = {
    studentDashboard: jest.fn().mockResolvedValue({ p: 1 }),
    teacherDashboard: jest.fn().mockResolvedValue({ t: 1 }),
  };
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: svc }],
    }).compile();
    ctrl = moduleRef.get(DashboardController);
  });
  afterEach(() => jest.clearAllMocks());

  it('endpoints delegate', async () => {
    await ctrl.studentDashboard(user);
    await ctrl.teacherDashboard(user);
    expect(svc.studentDashboard).toHaveBeenCalled();
    expect(svc.teacherDashboard).toHaveBeenCalled();
  });
});

describe('ReportsController + Repository', () => {
  let ctrl: ReportsController;
  let repo: ReportsRepository;
  const svc = {
    list: jest.fn().mockResolvedValue('list'),
    findById: jest.fn().mockResolvedValue('one'),
    create: jest.fn().mockResolvedValue('created'),
    update: jest.fn().mockResolvedValue('updated'),
    remove: jest.fn().mockResolvedValue('removed'),
  };
  const prisma = {
    report: {
      create: jest.fn().mockResolvedValue({ id: 'r' }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn().mockResolvedValue({ id: 'r' }),
      update: jest.fn().mockResolvedValue({ id: 'r' }),
      delete: jest.fn().mockResolvedValue({ id: 'r' }),
    },
  };
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        { provide: ReportsService, useValue: svc },
        ReportsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    ctrl = moduleRef.get(ReportsController);
    repo = moduleRef.get(ReportsRepository);
  });
  afterEach(() => jest.clearAllMocks());

  it('controller endpoints delegate', async () => {
    await ctrl.list({} as any, user);
    await ctrl.findById('r1', user);
    await ctrl.create({} as any, user);
    await ctrl.update('r1', {} as any, user);
    await ctrl.remove('r1', user);
    expect(svc.list).toHaveBeenCalled();
    expect(svc.findById).toHaveBeenCalled();
    expect(svc.create).toHaveBeenCalled();
    expect(svc.update).toHaveBeenCalled();
    expect(svc.remove).toHaveBeenCalled();
  });

  it('repository delegates to prisma', async () => {
    await repo.create({} as any);
    await repo.findAll({ skip: 0, take: 10, where: {}, orderBy: {} });
    await repo.findById('r1');
    await repo.update('r1', {});
    await repo.softDelete('r1');
    expect(prisma.report.create).toHaveBeenCalled();
    expect(prisma.report.delete).toHaveBeenCalled();
  });
});

describe('ResultsController + Repository', () => {
  let ctrl: ResultsController;
  let repo: ResultsRepository;
  const svc = {
    getSummary: jest.fn().mockResolvedValue({ s: 1 }),
    upsertSubjectScore: jest.fn().mockResolvedValue({ ok: true }),
    upsertGrowth: jest.fn().mockResolvedValue({ ok: true }),
  };
  const prisma = {
    subjectScore: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn().mockResolvedValue({ id: 's' }),
    },
    growthSnapshot: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn().mockResolvedValue({ id: 'g' }),
    },
  };
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ResultsController],
      providers: [
        { provide: ResultsService, useValue: svc },
        ResultsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    ctrl = moduleRef.get(ResultsController);
    repo = moduleRef.get(ResultsRepository);
  });
  afterEach(() => jest.clearAllMocks());

  it('controller endpoints delegate', async () => {
    await ctrl.myResults(user);
    await ctrl.forUser('u2', user);
    await ctrl.upsertSubjectScore('u2', { subjectLabel: 'M', score: 80 } as any, user);
    await ctrl.upsertGrowth('u2', { monthKey: '2026-01', monthLabel: 'Jan', score: 70 } as any, user);
    expect(svc.getSummary).toHaveBeenCalledTimes(2);
    expect(svc.upsertSubjectScore).toHaveBeenCalled();
    expect(svc.upsertGrowth).toHaveBeenCalled();
  });

  it('repository delegates to prisma', async () => {
    await repo.listSubjectScores('u1');
    await repo.upsertSubjectScore('u1', {
      userId: 'u1',
      subjectLabel: 'M',
      score: 80,
      maxScore: 100,
    } as any);
    await repo.listGrowthSnapshots('u1');
    await repo.upsertGrowthSnapshot('u1', {
      userId: 'u1',
      monthKey: '2026-01',
      monthLabel: 'Jan',
      score: 70,
    } as any);
    expect(prisma.subjectScore.upsert).toHaveBeenCalled();
    expect(prisma.growthSnapshot.upsert).toHaveBeenCalled();
  });
});
