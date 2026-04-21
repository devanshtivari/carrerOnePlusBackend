import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../common/decorators/public.decorator';
import { CurriculumService } from './curriculum.service';

@ApiTags('Catalog · Curriculum')
@Controller('courses')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Public()
  @Get(':id/curriculum')
  @ApiOperation({ summary: 'Get a course curriculum tree (units → chapters → lessons → resources)' })
  async byId(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.curriculumService.getCurriculumByCourseId(id);
  }

  @Public()
  @Get('slug/:slug/curriculum')
  @ApiOperation({ summary: 'Get a course curriculum tree by slug' })
  async bySlug(@Param('slug') slug: string) {
    return this.curriculumService.getCurriculumBySlug(slug);
  }
}
