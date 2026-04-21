import { UserRole } from '@prisma/client';

import { AssignmentsController } from '../assignments/assignments.controller';
import { ProjectsController } from '../projects/projects.controller';
import { AttemptsController } from '../tests/attempts.controller';
import { QuestionsController } from '../tests/questions.controller';
import { TestsController } from '../tests/tests.controller';

const STUDENT = { id: 'u1', role: UserRole.STUDENT } as any;
const ADMIN = { id: 'admin', role: UserRole.ADMIN } as any;

describe('TestsController', () => {
  const svc = {
    list: jest.fn().mockResolvedValue('list'),
    findByCode: jest.fn().mockResolvedValue('byCode'),
    findById: jest.fn().mockResolvedValue('byId'),
    create: jest.fn().mockResolvedValue('created'),
    update: jest.fn().mockResolvedValue('updated'),
    remove: jest.fn().mockResolvedValue('removed'),
  } as any;
  const ctrl = new TestsController(svc);

  it('delegates list', async () => {
    await expect(ctrl.list({} as any)).resolves.toBe('list');
  });
  it('delegates findByCode', async () => {
    await expect(ctrl.findByCode('TEST-1')).resolves.toBe('byCode');
  });
  it('delegates findById', async () => {
    await expect(ctrl.findById('id')).resolves.toBe('byId');
  });
  it('delegates create', async () => {
    await expect(ctrl.create({} as any)).resolves.toBe('created');
  });
  it('delegates update', async () => {
    await expect(ctrl.update('id', {} as any)).resolves.toBe('updated');
  });
  it('delegates remove', async () => {
    await expect(ctrl.remove('id')).resolves.toBe('removed');
  });
});

describe('QuestionsController', () => {
  const svc = {
    listForTest: jest.fn().mockResolvedValue('list'),
    findById: jest.fn().mockResolvedValue('byId'),
    create: jest.fn().mockResolvedValue('created'),
    update: jest.fn().mockResolvedValue('updated'),
    remove: jest.fn().mockResolvedValue('removed'),
  } as any;
  const ctrl = new QuestionsController(svc);

  it('delegates listForTest', async () => {
    await expect(ctrl.listForTest('t1')).resolves.toBe('list');
  });
  it('delegates findById', async () => {
    await expect(ctrl.findById('q1')).resolves.toBe('byId');
  });
  it('delegates create', async () => {
    await expect(ctrl.create('t1', {} as any)).resolves.toBe('created');
  });
  it('delegates update', async () => {
    await expect(ctrl.update('q1', {} as any)).resolves.toBe('updated');
  });
  it('delegates remove', async () => {
    await expect(ctrl.remove('q1')).resolves.toBe('removed');
  });
});

describe('AttemptsController', () => {
  const svc = {
    listMine: jest.fn().mockResolvedValue('mine'),
    listForTest: jest.fn().mockResolvedValue('forTest'),
    findById: jest.fn().mockResolvedValue('byId'),
    start: jest.fn().mockResolvedValue('started'),
    saveAnswer: jest.fn().mockResolvedValue('saved'),
    submit: jest.fn().mockResolvedValue('submitted'),
  } as any;
  const ctrl = new AttemptsController(svc);

  it('delegates listMine', async () => {
    await expect(ctrl.listMine(STUDENT)).resolves.toBe('mine');
  });
  it('delegates listForTest', async () => {
    await expect(ctrl.listForTest('t1', STUDENT)).resolves.toBe('forTest');
  });
  it('delegates findById', async () => {
    await expect(ctrl.findById('a1', STUDENT)).resolves.toBe('byId');
  });
  it('delegates start', async () => {
    await expect(ctrl.start({ testId: 't1' } as any, STUDENT)).resolves.toBe('started');
  });
  it('delegates saveAnswer', async () => {
    await expect(
      ctrl.saveAnswer('a1', { questionId: 'q1' } as any, STUDENT),
    ).resolves.toBe('saved');
  });
  it('delegates submit', async () => {
    await expect(ctrl.submit('a1', { answers: [] } as any, STUDENT)).resolves.toBe(
      'submitted',
    );
  });
});

describe('ProjectsController', () => {
  const svc = {
    list: jest.fn().mockResolvedValue('list'),
    listForUnit: jest.fn().mockResolvedValue('byUnit'),
    listForCourse: jest.fn().mockResolvedValue('byCourse'),
    findById: jest.fn().mockResolvedValue('byId'),
    create: jest.fn().mockResolvedValue('created'),
    update: jest.fn().mockResolvedValue('updated'),
    remove: jest.fn().mockResolvedValue('removed'),
    submit: jest.fn().mockResolvedValue('submitted'),
    listSubmissions: jest.fn().mockResolvedValue('subs'),
    listMySubmissions: jest.fn().mockResolvedValue('mine'),
    grade: jest.fn().mockResolvedValue('graded'),
    withdrawSubmission: jest.fn().mockResolvedValue('withdrawn'),
  } as any;
  const ctrl = new ProjectsController(svc);

  it('delegates list', async () => {
    await expect(ctrl.list({} as any)).resolves.toBe('list');
  });
  it('delegates listForUnit', async () => {
    await expect(ctrl.listForUnit('u1')).resolves.toBe('byUnit');
  });
  it('delegates listForCourse', async () => {
    await expect(ctrl.listForCourse('c1')).resolves.toBe('byCourse');
  });
  it('delegates findById', async () => {
    await expect(ctrl.findById('p1')).resolves.toBe('byId');
  });
  it('delegates create / update / remove', async () => {
    await expect(ctrl.create({} as any)).resolves.toBe('created');
    await expect(ctrl.update('p1', {} as any)).resolves.toBe('updated');
    await expect(ctrl.remove('p1')).resolves.toBe('removed');
  });
  it('delegates submission endpoints', async () => {
    await expect(ctrl.submit('p1', {} as any, STUDENT)).resolves.toBe('submitted');
    await expect(ctrl.listSubmissions('p1', STUDENT)).resolves.toBe('subs');
    await expect(ctrl.listMine(STUDENT)).resolves.toBe('mine');
    await expect(ctrl.grade('s1', {} as any, ADMIN)).resolves.toBe('graded');
    await expect(ctrl.withdrawSubmission('s1', STUDENT)).resolves.toBe('withdrawn');
  });
});

describe('AssignmentsController', () => {
  const svc = {
    list: jest.fn().mockResolvedValue('list'),
    listForClass: jest.fn().mockResolvedValue('byClass'),
    findById: jest.fn().mockResolvedValue('byId'),
    create: jest.fn().mockResolvedValue('created'),
    update: jest.fn().mockResolvedValue('updated'),
    remove: jest.fn().mockResolvedValue('removed'),
    submit: jest.fn().mockResolvedValue('submitted'),
    listSubmissions: jest.fn().mockResolvedValue('subs'),
    listMySubmissions: jest.fn().mockResolvedValue('mine'),
    grade: jest.fn().mockResolvedValue('graded'),
    withdrawSubmission: jest.fn().mockResolvedValue('withdrawn'),
  } as any;
  const ctrl = new AssignmentsController(svc);

  it('delegates basic endpoints', async () => {
    await expect(ctrl.list({} as any)).resolves.toBe('list');
    await expect(ctrl.listForClass('c1')).resolves.toBe('byClass');
    await expect(ctrl.findById('a1')).resolves.toBe('byId');
    await expect(ctrl.create({} as any)).resolves.toBe('created');
    await expect(ctrl.update('a1', {} as any)).resolves.toBe('updated');
    await expect(ctrl.remove('a1')).resolves.toBe('removed');
  });
  it('delegates submission endpoints', async () => {
    await expect(ctrl.submit('a1', {} as any, STUDENT)).resolves.toBe('submitted');
    await expect(ctrl.listSubmissions('a1', STUDENT)).resolves.toBe('subs');
    await expect(ctrl.listMine(STUDENT)).resolves.toBe('mine');
    await expect(ctrl.grade('s1', {} as any, ADMIN)).resolves.toBe('graded');
    await expect(ctrl.withdrawSubmission('s1', STUDENT)).resolves.toBe('withdrawn');
  });
});
