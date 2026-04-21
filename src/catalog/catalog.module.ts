import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { CategoriesController } from './categories.controller';
import { CategoriesRepository } from './categories.repository';
import { CategoriesService } from './categories.service';
import { ChaptersController } from './chapters.controller';
import { ChaptersRepository } from './chapters.repository';
import { ChaptersService } from './chapters.service';
import { CoursesController } from './courses.controller';
import { CoursesRepository } from './courses.repository';
import { CoursesService } from './courses.service';
import { CurriculumController } from './curriculum.controller';
import { CurriculumService } from './curriculum.service';
import { LessonsController } from './lessons.controller';
import { LessonsRepository } from './lessons.repository';
import { LessonsService } from './lessons.service';
import { ResourcesController } from './resources.controller';
import { ResourcesRepository } from './resources.repository';
import { ResourcesService } from './resources.service';
import { UnitsController } from './units.controller';
import { UnitsRepository } from './units.repository';
import { UnitsService } from './units.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    CategoriesController,
    CoursesController,
    CurriculumController,
    UnitsController,
    ChaptersController,
    LessonsController,
    ResourcesController,
  ],
  providers: [
    CategoriesService,
    CategoriesRepository,
    CoursesService,
    CoursesRepository,
    UnitsService,
    UnitsRepository,
    ChaptersService,
    ChaptersRepository,
    LessonsService,
    LessonsRepository,
    ResourcesService,
    ResourcesRepository,
    CurriculumService,
  ],
  exports: [
    CategoriesService,
    CategoriesRepository,
    CoursesService,
    CoursesRepository,
    UnitsService,
    ChaptersService,
    LessonsService,
    ResourcesService,
  ],
})
export class CatalogModule {}
