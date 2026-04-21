import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { LabsController } from './labs.controller';
import { LabsRepository } from './labs.repository';
import { LabsService } from './labs.service';

@Module({
  imports: [PrismaModule],
  controllers: [LabsController],
  providers: [LabsService, LabsRepository],
  exports: [LabsService, LabsRepository],
})
export class LabsModule {}
