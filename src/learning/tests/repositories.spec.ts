import { Test, TestingModule } from '@nestjs/testing';
import { ClassMembershipRole, LeaderboardScope } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ClassesRepository } from '../classes/classes.repository';
import { EnrollmentsRepository } from '../enrollments/enrollments.repository';
import { LeaderboardRepository } from '../leaderboard/leaderboard.repository';
import { LessonCompletionsRepository } from '../progress/lesson-completions.repository';

function makePrismaMock() {
  const fns = () => ({
    create: jest.fn().mockResolvedValue({ id: 'x' }),
    createMany: jest.fn().mockResolvedValue({ count: 0 }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue({ id: 'x' }),
    findFirst: jest.fn().mockResolvedValue({ id: 'x' }),
    update: jest.fn().mockResolvedValue({ id: 'x' }),
    delete: jest.fn().mockResolvedValue({ id: 'x' }),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    count: jest.fn().mockResolvedValue(0),
    groupBy: jest.fn().mockResolvedValue([]),
    upsert: jest.fn().mockResolvedValue({ id: 'x' }),
  });
  return {
    enrollment: fns(),
    lessonCompletion: fns(),
    class: fns(),
    classMembership: fns(),
    leaderboardEntry: fns(),
    user: fns(),
  };
}

describe('Learning repositories', () => {
  let prisma: any;
  let enrollments: EnrollmentsRepository;
  let completions: LessonCompletionsRepository;
  let classes: ClassesRepository;
  let leaderboard: LeaderboardRepository;

  beforeEach(async () => {
    prisma = makePrismaMock();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsRepository,
        LessonCompletionsRepository,
        ClassesRepository,
        LeaderboardRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    enrollments = moduleRef.get(EnrollmentsRepository);
    completions = moduleRef.get(LessonCompletionsRepository);
    classes = moduleRef.get(ClassesRepository);
    leaderboard = moduleRef.get(LeaderboardRepository);
  });

  describe('EnrollmentsRepository', () => {
    it('CRUD + finders delegate', async () => {
      prisma.enrollment.findMany.mockResolvedValue([{ id: 'e1' }]);
      prisma.enrollment.count.mockResolvedValue(1);
      const result = await enrollments.findAll({ skip: 0, take: 10, where: {}, orderBy: {} });
      expect(result.total).toBe(1);

      await enrollments.create({} as any);
      await enrollments.findById('id');
      await enrollments.findByUserAndCourse('u', 'c');
      await enrollments.update('id', {});
      await enrollments.softDelete('id');
      expect(prisma.enrollment.create).toHaveBeenCalled();
      expect(prisma.enrollment.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.enrollment.update).toHaveBeenCalled();
      expect(prisma.enrollment.delete).toHaveBeenCalled();
    });
  });

  describe('LessonCompletionsRepository', () => {
    it('CRUD + finders delegate', async () => {
      await completions.create({} as any);
      await completions.findByUserAndLesson('u', 'l');
      await completions.listByUserAndCourse('u', 'c');
      await completions.listByUserAndChapter('u', 'ch');
      await completions.deleteByUserAndLesson('u', 'l');
      expect(prisma.lessonCompletion.create).toHaveBeenCalled();
      expect(prisma.lessonCompletion.findUnique).toHaveBeenCalled();
      expect(prisma.lessonCompletion.findMany).toHaveBeenCalledTimes(2);
      expect(prisma.lessonCompletion.delete).toHaveBeenCalled();
    });
  });

  describe('ClassesRepository', () => {
    it('CRUD + memberships delegate', async () => {
      prisma.class.findMany.mockResolvedValue([]);
      prisma.class.count.mockResolvedValue(0);
      await classes.findAll({ skip: 0, take: 10, where: {}, orderBy: {} });
      await classes.create({} as any);
      await classes.findById('id');
      await classes.findByCode('a');
      await classes.update('id', {});
      await classes.softDelete('id');
      await classes.listMembers('cls1');
      await classes.listMembershipsForUser('u1');
      await classes.findMembership('cls1', 'u1', ClassMembershipRole.STUDENT);
      await classes.addMember({} as any);
      await classes.removeMembership('m1');
      await classes.findMembershipById('m1');
      expect(prisma.class.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.classMembership.findMany).toHaveBeenCalledTimes(2);
      expect(prisma.classMembership.findFirst).toHaveBeenCalled();
    });
  });

  describe('LeaderboardRepository', () => {
    it('listScoped + replaceScope + aggregates delegate', async () => {
      await leaderboard.listScoped(LeaderboardScope.GLOBAL, null, 10);
      await leaderboard.findUserEntry(LeaderboardScope.GLOBAL, null, 'me');
      prisma.leaderboardEntry.createMany.mockResolvedValue({ count: 2 });
      await leaderboard.replaceScope(LeaderboardScope.GLOBAL, null, [
        { scope: LeaderboardScope.GLOBAL, userId: 'a', rank: 1, points: 10, coursesDone: 0, streakDays: 0 } as any,
      ]);
      await leaderboard.replaceScope(LeaderboardScope.GLOBAL, null, []);
      await leaderboard.deleteScope(LeaderboardScope.GLOBAL, null);
      await leaderboard.listUsersForScope(LeaderboardScope.GLOBAL, null);
      await leaderboard.listUsersForScope(LeaderboardScope.NATIONAL, 'IN');
      // CLASS branch
      prisma.classMembership.findMany.mockResolvedValue([
        { user: { id: 'u1', totalScore: 100 } },
      ]);
      await leaderboard.listUsersForScope(LeaderboardScope.CLASS, 'cls1');
      // CLASS without scopeKey returns []
      const empty = await leaderboard.listUsersForScope(LeaderboardScope.CLASS, null);
      expect(empty).toEqual([]);
      // SCHOOL branch
      await leaderboard.listUsersForScope(LeaderboardScope.SCHOOL, 'school');
      const emptySchool = await leaderboard.listUsersForScope(LeaderboardScope.SCHOOL, null);
      expect(emptySchool).toEqual([]);

      prisma.enrollment.groupBy.mockResolvedValue([
        { userId: 'u1', _count: { _all: 3 } },
      ]);
      const map = await leaderboard.getAggregatesForUsers(['u1']);
      expect(map.get('u1')?.coursesDone).toBe(3);
      const emptyMap = await leaderboard.getAggregatesForUsers([]);
      expect(emptyMap.size).toBe(0);
    });
  });
});
