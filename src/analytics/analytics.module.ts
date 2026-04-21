import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ReportsController } from './reports.controller';
import { ReportsRepository } from './reports.repository';
import { ReportsService } from './reports.service';
import { ResultsController } from './results.controller';
import { ResultsRepository } from './results.repository';
import { ResultsService } from './results.service';

@Module({
  imports: [PrismaModule],
  controllers: [ResultsController, ReportsController, DashboardController],
  providers: [
    ResultsService,
    ResultsRepository,
    ReportsService,
    ReportsRepository,
    DashboardService,
  ],
  exports: [ResultsService, ResultsRepository, ReportsService, ReportsRepository, DashboardService],
})
export class AnalyticsModule {}
