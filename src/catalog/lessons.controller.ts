import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User, UserRole } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonsService } from './lessons.service';

@ApiTags('Catalog · Lessons')
@Controller()
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Public()
  @Get('chapters/:chapterId/lessons')
  @ApiOperation({ summary: 'List lessons for a chapter' })
  async listByChapter(@Param('chapterId', new ParseUUIDPipe()) chapterId: string) {
    return this.lessonsService.listByChapter(chapterId);
  }

  @Public()
  @Get('lessons/:id')
  @ApiOperation({ summary: 'Fetch a lesson by id' })
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.lessonsService.findById(id);
  }

  @Post('lessons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a lesson (admin or owning instructor)' })
  async create(@Body() dto: CreateLessonDto, @CurrentUser() user: User) {
    return this.lessonsService.create(dto, { id: user.id, role: user.role });
  }

  @Patch('lessons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a lesson (admin or owning instructor)' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateLessonDto,
    @CurrentUser() user: User,
  ) {
    return this.lessonsService.update(id, dto, { id: user.id, role: user.role });
  }

  @Delete('lessons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a lesson (admin or owning instructor)' })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ) {
    return this.lessonsService.remove(id, { id: user.id, role: user.role });
  }
}
