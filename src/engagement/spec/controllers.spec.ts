import { Test, TestingModule } from '@nestjs/testing';
import { AnnouncementAudience, UserRole } from '@prisma/client';

import { AlertsController } from '../alerts.controller';
import { AlertsService } from '../alerts.service';
import { AnnouncementsController } from '../announcements.controller';
import { AnnouncementsService } from '../announcements.service';
import { CalendarEventsController } from '../calendar-events.controller';
import { CalendarEventsService } from '../calendar-events.service';
import { FeedbackController } from '../feedback.controller';
import { FeedbackService } from '../feedback.service';
import { NotificationsController } from '../notifications.controller';
import { NotificationsService } from '../notifications.service';

const user = { id: 'u1', role: UserRole.INSTRUCTOR } as any;
const student = { id: 's1', role: UserRole.STUDENT } as any;

describe('AnnouncementsController', () => {
  let ctrl: AnnouncementsController;
  const svc = {
    list: jest.fn().mockResolvedValue('list'),
    findById: jest.fn().mockResolvedValue('one'),
    create: jest.fn().mockResolvedValue('created'),
    update: jest.fn().mockResolvedValue('updated'),
    remove: jest.fn().mockResolvedValue('removed'),
  };
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AnnouncementsController],
      providers: [{ provide: AnnouncementsService, useValue: svc }],
    }).compile();
    ctrl = moduleRef.get(AnnouncementsController);
  });
  afterEach(() => jest.clearAllMocks());

  it('list delegates', async () => {
    await ctrl.list({} as any);
    expect(svc.list).toHaveBeenCalled();
  });

  it('listForMe maps role to STUDENT audience', async () => {
    await ctrl.listForMe({} as any, student);
    expect(svc.list).toHaveBeenCalledWith({}, AnnouncementAudience.STUDENT);
  });

  it('listForMe maps INSTRUCTOR audience', async () => {
    await ctrl.listForMe({} as any, user);
    expect(svc.list).toHaveBeenCalledWith({}, AnnouncementAudience.INSTRUCTOR);
  });

  it('listForMe maps ADMIN to ALL', async () => {
    await ctrl.listForMe({} as any, { id: 'admin', role: UserRole.ADMIN } as any);
    expect(svc.list).toHaveBeenCalledWith({}, AnnouncementAudience.ALL);
  });

  it('findById/create/update/remove delegate', async () => {
    await ctrl.findById('id');
    await ctrl.create({} as any, user);
    await ctrl.update('id', {} as any);
    await ctrl.remove('id');
    expect(svc.findById).toHaveBeenCalledWith('id');
    expect(svc.create).toHaveBeenCalled();
    expect(svc.update).toHaveBeenCalled();
    expect(svc.remove).toHaveBeenCalledWith('id');
  });
});

describe('NotificationsController', () => {
  let ctrl: NotificationsController;
  const svc = {
    listForUser: jest.fn().mockResolvedValue('listed'),
    markAllRead: jest.fn().mockResolvedValue({ count: 1 }),
    markRead: jest.fn().mockResolvedValue('marked'),
    create: jest.fn().mockResolvedValue('created'),
    remove: jest.fn().mockResolvedValue('removed'),
  };
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: svc }],
    }).compile();
    ctrl = moduleRef.get(NotificationsController);
  });
  afterEach(() => jest.clearAllMocks());

  it('endpoints delegate', async () => {
    await ctrl.listMine({} as any, student);
    await ctrl.markAllRead(student);
    await ctrl.markRead('n1', student);
    await ctrl.create({} as any, user);
    await ctrl.remove('n1', student);
    expect(svc.listForUser).toHaveBeenCalled();
    expect(svc.markAllRead).toHaveBeenCalled();
    expect(svc.markRead).toHaveBeenCalled();
    expect(svc.create).toHaveBeenCalled();
    expect(svc.remove).toHaveBeenCalled();
  });
});

describe('AlertsController', () => {
  let ctrl: AlertsController;
  const svc = {
    list: jest.fn().mockResolvedValue('list'),
    findById: jest.fn().mockResolvedValue('one'),
    create: jest.fn().mockResolvedValue('created'),
    update: jest.fn().mockResolvedValue('updated'),
    resolve: jest.fn().mockResolvedValue('resolved'),
    remove: jest.fn().mockResolvedValue('removed'),
  };
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AlertsController],
      providers: [{ provide: AlertsService, useValue: svc }],
    }).compile();
    ctrl = moduleRef.get(AlertsController);
  });
  afterEach(() => jest.clearAllMocks());

  it('endpoints delegate', async () => {
    await ctrl.list({} as any);
    await ctrl.findById('a1');
    await ctrl.create({} as any);
    await ctrl.update('a1', {} as any);
    await ctrl.resolve('a1', user);
    await ctrl.remove('a1');
    expect(svc.list).toHaveBeenCalled();
    expect(svc.findById).toHaveBeenCalledWith('a1');
    expect(svc.create).toHaveBeenCalled();
    expect(svc.update).toHaveBeenCalled();
    expect(svc.resolve).toHaveBeenCalled();
    expect(svc.remove).toHaveBeenCalledWith('a1');
  });
});

describe('FeedbackController', () => {
  let ctrl: FeedbackController;
  const svc = {
    list: jest.fn().mockResolvedValue('list'),
    findById: jest.fn().mockResolvedValue('one'),
    create: jest.fn().mockResolvedValue('created'),
    update: jest.fn().mockResolvedValue('updated'),
    remove: jest.fn().mockResolvedValue('removed'),
  };
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FeedbackController],
      providers: [{ provide: FeedbackService, useValue: svc }],
    }).compile();
    ctrl = moduleRef.get(FeedbackController);
  });
  afterEach(() => jest.clearAllMocks());

  it('endpoints delegate', async () => {
    await ctrl.list({} as any, user);
    await ctrl.findById('f1', user);
    await ctrl.create({} as any, user);
    await ctrl.update('f1', {} as any, user);
    await ctrl.remove('f1', user);
    expect(svc.list).toHaveBeenCalled();
    expect(svc.findById).toHaveBeenCalled();
    expect(svc.create).toHaveBeenCalled();
    expect(svc.update).toHaveBeenCalled();
    expect(svc.remove).toHaveBeenCalled();
  });
});

describe('CalendarEventsController', () => {
  let ctrl: CalendarEventsController;
  const svc = {
    list: jest.fn().mockResolvedValue('list'),
    findById: jest.fn().mockResolvedValue('one'),
    create: jest.fn().mockResolvedValue('created'),
    update: jest.fn().mockResolvedValue('updated'),
    remove: jest.fn().mockResolvedValue('removed'),
  };
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CalendarEventsController],
      providers: [{ provide: CalendarEventsService, useValue: svc }],
    }).compile();
    ctrl = moduleRef.get(CalendarEventsController);
  });
  afterEach(() => jest.clearAllMocks());

  it('endpoints delegate', async () => {
    await ctrl.list({} as any);
    await ctrl.findById('e1');
    await ctrl.create({} as any, user);
    await ctrl.update('e1', {} as any, user);
    await ctrl.remove('e1', user);
    expect(svc.list).toHaveBeenCalled();
    expect(svc.findById).toHaveBeenCalledWith('e1');
    expect(svc.create).toHaveBeenCalled();
    expect(svc.update).toHaveBeenCalled();
    expect(svc.remove).toHaveBeenCalled();
  });
});
