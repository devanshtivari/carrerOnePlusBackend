import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { IsUUID } from 'class-validator';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProgressService } from './progress.service';

class MarkLessonDto {
  @IsUUID()
  lessonId!: string;
}

@ApiTags('Learning · Progress')
@Controller('progress')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('lessons')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a lesson as complete for the current user' })
  async markLesson(@Body() dto: MarkLessonDto, @CurrentUser() user: User) {
    return this.progressService.markLessonComplete(dto.lessonId, {
      id: user.id,
      role: user.role,
    });
  }

  @Delete('lessons/:lessonId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unmark a lesson as complete' })
  async unmarkLesson(
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
    @CurrentUser() user: User,
  ) {
    return this.progressService.unmarkLessonComplete(lessonId, {
      id: user.id,
      role: user.role,
    });
  }

  @Get('courses/:courseId')
  @ApiOperation({ summary: 'Get the current user’s progress in a course' })
  async getCourseProgress(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @CurrentUser() user: User,
  ) {
    return this.progressService.getCourseProgress(courseId, {
      id: user.id,
      role: user.role,
    });
  }

  @Get('users/:userId/courses/:courseId')
  @ApiOperation({ summary: 'Get a user’s progress in a course (admin or self)' })
  async getUserCourseProgress(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @CurrentUser() user: User,
  ) {
    return this.progressService.getCourseProgressForUser(userId, courseId, {
      id: user.id,
      role: user.role,
    });
  }
}
