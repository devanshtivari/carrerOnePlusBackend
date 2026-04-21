import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AlertsController } from './alerts.controller';
import { AlertsRepository } from './alerts.repository';
import { AlertsService } from './alerts.service';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsRepository } from './announcements.repository';
import { AnnouncementsService } from './announcements.service';
import { CalendarEventsController } from './calendar-events.controller';
import { CalendarEventsRepository } from './calendar-events.repository';
import { CalendarEventsService } from './calendar-events.service';
import { FeedbackController } from './feedback.controller';
import { FeedbackRepository } from './feedback.repository';
import { FeedbackService } from './feedback.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    AnnouncementsController,
    NotificationsController,
    AlertsController,
    FeedbackController,
    CalendarEventsController,
  ],
  providers: [
    AnnouncementsService,
    AnnouncementsRepository,
    NotificationsService,
    NotificationsRepository,
    AlertsService,
    AlertsRepository,
    FeedbackService,
    FeedbackRepository,
    CalendarEventsService,
    CalendarEventsRepository,
  ],
  exports: [
    AnnouncementsService,
    AnnouncementsRepository,
    NotificationsService,
    NotificationsRepository,
    AlertsService,
    AlertsRepository,
    FeedbackService,
    FeedbackRepository,
    CalendarEventsService,
    CalendarEventsRepository,
  ],
})
export class EngagementModule {}
