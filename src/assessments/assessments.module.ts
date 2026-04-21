import { Module } from '@nestjs/common';

import { CatalogModule } from '../catalog/catalog.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AssignmentsController } from './assignments/assignments.controller';
import { AssignmentsRepository } from './assignments/assignments.repository';
import { AssignmentsService } from './assignments/assignments.service';
import { ProjectsController } from './projects/projects.controller';
import { ProjectsRepository } from './projects/projects.repository';
import { ProjectsService } from './projects/projects.service';
import { AttemptsController } from './tests/attempts.controller';
import { AttemptsRepository } from './tests/attempts.repository';
import { AttemptsService } from './tests/attempts.service';
import { QuestionsController } from './tests/questions.controller';
import { QuestionsRepository } from './tests/questions.repository';
import { QuestionsService } from './tests/questions.service';
import { TestsController } from './tests/tests.controller';
import { TestsRepository } from './tests/tests.repository';
import { TestsService } from './tests/tests.service';

@Module({
  imports: [PrismaModule, CatalogModule],
  controllers: [
    TestsController,
    QuestionsController,
    AttemptsController,
    ProjectsController,
    AssignmentsController,
  ],
  providers: [
    TestsService,
    TestsRepository,
    QuestionsService,
    QuestionsRepository,
    AttemptsService,
    AttemptsRepository,
    ProjectsService,
    ProjectsRepository,
    AssignmentsService,
    AssignmentsRepository,
  ],
  exports: [
    TestsService,
    TestsRepository,
    QuestionsService,
    QuestionsRepository,
    AttemptsService,
    AttemptsRepository,
    ProjectsService,
    ProjectsRepository,
    AssignmentsService,
    AssignmentsRepository,
  ],
})
export class AssessmentsModule {}
