import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { AlertsRepository } from '../alerts.repository';
import { AnnouncementsRepository } from '../announcements.repository';
import { CalendarEventsRepository } from '../calendar-events.repository';
import { FeedbackRepository } from '../feedback.repository';
import { NotificationsRepository } from '../notifications.repository';

function makeModel() {
  return {
    create: jest.fn().mockResolvedValue({ id: 'x' }),
    createMany: jest.fn().mockResolvedValue({ count: 2 }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue({ id: 'x' }),
    count: jest.fn().mockResolvedValue(0),
    update: jest.fn().mockResolvedValue({ id: 'x' }),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    delete: jest.fn().mockResolvedValue({ id: 'x' }),
  };
}

describe('Engagement repositories', () => {
  const announcement = makeModel();
  const notification = makeModel();
  const alert = makeModel();
  const feedback = makeModel();
  const calendarEvent = makeModel();
  const prisma = { announcement, notification, alert, feedback, calendarEvent } as any;

  let announcementsRepo: AnnouncementsRepository;
  let notificationsRepo: NotificationsRepository;
  let alertsRepo: AlertsRepository;
  let feedbackRepo: FeedbackRepository;
  let eventsRepo: CalendarEventsRepository;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementsRepository,
        NotificationsRepository,
        AlertsRepository,
        FeedbackRepository,
        CalendarEventsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    announcementsRepo = moduleRef.get(AnnouncementsRepository);
    notificationsRepo = moduleRef.get(NotificationsRepository);
    alertsRepo = moduleRef.get(AlertsRepository);
    feedbackRepo = moduleRef.get(FeedbackRepository);
    eventsRepo = moduleRef.get(CalendarEventsRepository);
  });

  afterEach(() => jest.clearAllMocks());

  it('AnnouncementsRepository delegates', async () => {
    await announcementsRepo.create({} as any);
    await announcementsRepo.findAll({ skip: 0, take: 10, where: {}, orderBy: {} });
    await announcementsRepo.findById('id');
    await announcementsRepo.update('id', {});
    await announcementsRepo.softDelete('id');
    expect(announcement.create).toHaveBeenCalled();
    expect(announcement.findMany).toHaveBeenCalled();
    expect(announcement.count).toHaveBeenCalled();
    expect(announcement.findUnique).toHaveBeenCalled();
    expect(announcement.update).toHaveBeenCalled();
    expect(announcement.delete).toHaveBeenCalled();
  });

  it('NotificationsRepository delegates including markRead/markAllRead', async () => {
    notification.findMany.mockResolvedValueOnce([]);
    notification.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    await notificationsRepo.create({} as any);
    await notificationsRepo.createMany([{ userId: 'u', type: 'SYSTEM', title: 't', body: 'b' }]);
    await notificationsRepo.findAll({ skip: 0, take: 10, where: {}, orderBy: {} });
    await notificationsRepo.findById('id');
    await notificationsRepo.markRead('id');
    await notificationsRepo.markAllRead('u1');
    await notificationsRepo.softDelete('id');
    expect(notification.create).toHaveBeenCalled();
    expect(notification.createMany).toHaveBeenCalled();
    expect(notification.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'id' } }),
    );
    expect(notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1', readAt: null } }),
    );
    expect(notification.delete).toHaveBeenCalled();
  });

  it('AlertsRepository delegates including resolve', async () => {
    await alertsRepo.create({} as any);
    await alertsRepo.findAll({ skip: 0, take: 10, where: {}, orderBy: {} });
    await alertsRepo.findById('id');
    await alertsRepo.update('id', {});
    await alertsRepo.resolve('id', 'user1');
    await alertsRepo.softDelete('id');
    expect(alert.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ resolvedBy: { connect: { id: 'user1' } } }),
      }),
    );
  });

  it('FeedbackRepository delegates', async () => {
    await feedbackRepo.create({} as any);
    await feedbackRepo.findAll({ skip: 0, take: 10, where: {}, orderBy: {} });
    await feedbackRepo.findById('id');
    await feedbackRepo.update('id', {});
    await feedbackRepo.softDelete('id');
    expect(feedback.create).toHaveBeenCalled();
    expect(feedback.findMany).toHaveBeenCalled();
  });

  it('CalendarEventsRepository delegates', async () => {
    await eventsRepo.create({} as any);
    await eventsRepo.findAll({ skip: 0, take: 10, where: {}, orderBy: {} });
    await eventsRepo.findById('id');
    await eventsRepo.update('id', {});
    await eventsRepo.softDelete('id');
    expect(calendarEvent.create).toHaveBeenCalled();
  });
});
