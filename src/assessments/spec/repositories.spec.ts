import { Test, TestingModule } from '@nestjs/testing';
import { AttemptStatus, SubmissionStatus, TestStatus, TestType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { AssignmentsRepository } from '../assignments/assignments.repository';
import { ProjectsRepository } from '../projects/projects.repository';
import { AttemptsRepository } from '../tests/attempts.repository';
import { QuestionsRepository } from '../tests/questions.repository';
import { TestsRepository } from '../tests/tests.repository';

function makeFns(extra: Record<string, jest.Mock> = {}) {
  return {
    create: jest.fn().mockResolvedValue({ id: 'x' }),
    createMany: jest.fn().mockResolvedValue({ count: 0 }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue({ id: 'x' }),
    findFirst: jest.fn().mockResolvedValue({ id: 'x' }),
    update: jest.fn().mockResolvedValue({ id: 'x' }),
    delete: jest.fn().mockResolvedValue({ id: 'x' }),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    count: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue({ _count: { _all: 0 }, _sum: { marks: 0 } }),
    upsert: jest.fn().mockResolvedValue({ id: 'x' }),
    ...extra,
  };
}

function makePrismaMock() {
  return {
    test: makeFns(),
    question: makeFns(),
    questionOption: makeFns(),
    testAttempt: makeFns(),
    attemptAnswer: makeFns(),
    project: makeFns(),
    projectSubmission: makeFns(),
    assignment: makeFns(),
    assignmentSubmission: makeFns(),
    $transaction: jest.fn().mockResolvedValue([]),
  };
}

describe('Assessments repositories', () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let tests: TestsRepository;
  let questions: QuestionsRepository;
  let attempts: AttemptsRepository;
  let projects: ProjectsRepository;
  let assignments: AssignmentsRepository;

  beforeEach(async () => {
    prisma = makePrismaMock();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        TestsRepository,
        QuestionsRepository,
        AttemptsRepository,
        ProjectsRepository,
        AssignmentsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    tests = moduleRef.get(TestsRepository);
    questions = moduleRef.get(QuestionsRepository);
    attempts = moduleRef.get(AttemptsRepository);
    projects = moduleRef.get(ProjectsRepository);
    assignments = moduleRef.get(AssignmentsRepository);
  });

  describe('TestsRepository', () => {
    it('crud delegates to prisma.test', async () => {
      await tests.create({ code: 'C', title: 'T' } as any);
      await tests.findAll({ skip: 0, take: 10, where: {}, orderBy: {} });
      await tests.findById('id');
      await tests.findByCode('C');
      await tests.update('id', {});
      await tests.softDelete('id');
      expect(prisma.test.create).toHaveBeenCalled();
      expect(prisma.test.findMany).toHaveBeenCalled();
      expect(prisma.test.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.test.update).toHaveBeenCalled();
      expect(prisma.test.delete).toHaveBeenCalled();
    });
    it('refreshTotals aggregates and updates', async () => {
      prisma.test.update.mockResolvedValueOnce({ id: 'x' });
      prisma.question.aggregate.mockResolvedValueOnce({
        _count: { _all: 3 },
        _sum: { marks: 15 },
      });
      await tests.refreshTotals('t1');
      expect(prisma.test.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { totalQuestions: 3, totalMarks: 15 },
      });
    });
  });

  describe('QuestionsRepository', () => {
    it('crud delegates to prisma.question', async () => {
      await questions.findById('id');
      await questions.findByTest('t1');
      await questions.findByTestAndPosition('t1', 2);
      await questions.create({ test: { connect: { id: 't1' } } } as any);
      await questions.update('id', {});
      await questions.softDelete('id');
      expect(prisma.question.findUnique).toHaveBeenCalled();
      expect(prisma.question.findMany).toHaveBeenCalled();
      expect(prisma.question.findFirst).toHaveBeenCalled();
      expect(prisma.question.create).toHaveBeenCalled();
      expect(prisma.question.update).toHaveBeenCalled();
      expect(prisma.question.delete).toHaveBeenCalled();
    });
    it('replaceOptions runs a transaction (with createMany when options present)', async () => {
      await questions.replaceOptions('q1', [
        { label: 'a', text: 'A' },
        { label: 'b', text: 'B', isCorrect: true, position: 2 },
      ]);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.questionOption.deleteMany).toHaveBeenCalled();
      expect(prisma.questionOption.createMany).toHaveBeenCalled();
    });
    it('replaceOptions does not call createMany when options are empty', async () => {
      await questions.replaceOptions('q1', []);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.questionOption.createMany).not.toHaveBeenCalled();
    });
  });

  describe('AttemptsRepository', () => {
    it('crud + answer upsert delegate', async () => {
      await attempts.create({
        test: { connect: { id: 't1' } },
        user: { connect: { id: 'u1' } },
      } as any);
      await attempts.findById('id');
      await attempts.findActiveForUser('t1', 'u1');
      await attempts.listForUser('u1', { status: AttemptStatus.IN_PROGRESS });
      await attempts.listForTest('t1');
      await attempts.update('id', {});
      await attempts.upsertAnswer('a1', 'q1', { selectedLabel: 'a' });
      await attempts.deleteForAttempt('a1');
      expect(prisma.testAttempt.create).toHaveBeenCalled();
      expect(prisma.testAttempt.findUnique).toHaveBeenCalled();
      expect(prisma.testAttempt.findFirst).toHaveBeenCalled();
      expect(prisma.testAttempt.findMany).toHaveBeenCalledTimes(2);
      expect(prisma.testAttempt.update).toHaveBeenCalled();
      expect(prisma.attemptAnswer.upsert).toHaveBeenCalled();
      expect(prisma.attemptAnswer.deleteMany).toHaveBeenCalled();
    });
  });

  describe('ProjectsRepository', () => {
    it('crud + submission delegate', async () => {
      await projects.create({ title: 'p' } as any);
      await projects.findAll({ skip: 0, take: 10, where: {}, orderBy: {} });
      await projects.findById('id');
      await projects.findByUnit('u1');
      await projects.findByCourse('c1');
      await projects.update('id', {});
      await projects.softDelete('id');
      await projects.findSubmission('p1', 'u1');
      await projects.findSubmissionById('s1');
      await projects.listSubmissions('p1');
      await projects.listSubmissionsForUser('u1');
      await projects.upsertSubmission('p1', 'u1', { status: SubmissionStatus.SUBMITTED });
      await projects.updateSubmission('s1', {});
      await projects.softDeleteSubmission('s1');
      expect(prisma.project.create).toHaveBeenCalled();
      expect(prisma.project.findMany).toHaveBeenCalledTimes(3);
      expect(prisma.projectSubmission.upsert).toHaveBeenCalled();
      expect(prisma.projectSubmission.update).toHaveBeenCalled();
      expect(prisma.projectSubmission.delete).toHaveBeenCalled();
    });
  });

  describe('AssignmentsRepository', () => {
    it('crud + submission + counter delegates', async () => {
      await assignments.create({ title: 'a' } as any);
      await assignments.findAll({ skip: 0, take: 10, where: {}, orderBy: {} });
      await assignments.findById('id');
      await assignments.findByClass('c1');
      await assignments.update('id', {});
      await assignments.softDelete('id');
      await assignments.incrementSubmittedCount('id', 1);
      await assignments.findSubmission('a1', 'u1');
      await assignments.findSubmissionById('s1');
      await assignments.listSubmissions('a1');
      await assignments.listSubmissionsForUser('u1');
      await assignments.upsertSubmission('a1', 'u1', { status: SubmissionStatus.SUBMITTED });
      await assignments.updateSubmission('s1', {});
      await assignments.softDeleteSubmission('s1');
      expect(prisma.assignment.create).toHaveBeenCalled();
      expect(prisma.assignment.findMany).toHaveBeenCalledTimes(2);
      expect(prisma.assignment.update).toHaveBeenCalledTimes(2); // update + incrementSubmittedCount
      expect(prisma.assignmentSubmission.upsert).toHaveBeenCalled();
      expect(prisma.assignmentSubmission.update).toHaveBeenCalled();
      expect(prisma.assignmentSubmission.delete).toHaveBeenCalled();
    });
  });

  // dummy assertions to make sure unused imports do not fail tree-shaking
  it('imports schema enums for typing only', () => {
    expect(TestStatus.LIVE).toBe('LIVE');
    expect(TestType.MCQ).toBe('MCQ');
  });
});
