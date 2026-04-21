import { Module } from '@nestjs/common';

import { CatalogModule } from '../catalog/catalog.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ClassesController } from './classes/classes.controller';
import { ClassesRepository } from './classes/classes.repository';
import { ClassesService } from './classes/classes.service';
import { EnrollmentsController } from './enrollments/enrollments.controller';
import { EnrollmentsRepository } from './enrollments/enrollments.repository';
import { EnrollmentsService } from './enrollments/enrollments.service';
import { LeaderboardController } from './leaderboard/leaderboard.controller';
import { LeaderboardRepository } from './leaderboard/leaderboard.repository';
import { LeaderboardService } from './leaderboard/leaderboard.service';
import { LessonCompletionsRepository } from './progress/lesson-completions.repository';
import { ProgressController } from './progress/progress.controller';
import { ProgressService } from './progress/progress.service';

@Module({
  imports: [PrismaModule, CatalogModule],
  controllers: [
    EnrollmentsController,
    ProgressController,
    ClassesController,
    LeaderboardController,
  ],
  providers: [
    EnrollmentsService,
    EnrollmentsRepository,
    ProgressService,
    LessonCompletionsRepository,
    ClassesService,
    ClassesRepository,
    LeaderboardService,
    LeaderboardRepository,
  ],
  exports: [
    EnrollmentsService,
    EnrollmentsRepository,
    ProgressService,
    LessonCompletionsRepository,
    ClassesService,
    ClassesRepository,
    LeaderboardService,
    LeaderboardRepository,
  ],
})
export class LearningModule {}
