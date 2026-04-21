import {
  Body,
  Controller,
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

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StartAttemptDto, SubmitAnswerDto, SubmitAttemptDto } from '../dto/attempt.dto';
import { AttemptsService } from './attempts.service';

@ApiTags('Assessments · Attempts')
@Controller('attempts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Get('me')
  @ApiOperation({ summary: 'List the current user’s test attempts' })
  async listMine(@CurrentUser() user: User) {
    return this.attemptsService.listMine({ id: user.id, role: user.role });
  }

  @Get('test/:testId')
  @ApiOperation({
    summary:
      'List attempts for a test (own attempts for students, all attempts for instructors/admins)',
  })
  async listForTest(
    @Param('testId', new ParseUUIDPipe()) testId: string,
    @CurrentUser() user: User,
  ) {
    return this.attemptsService.listForTest(testId, { id: user.id, role: user.role });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch an attempt by id' })
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ) {
    return this.attemptsService.findById(id, { id: user.id, role: user.role });
  }

  @Post('start')
  @ApiOperation({ summary: 'Start (or resume) an attempt for a test' })
  async start(@Body() dto: StartAttemptDto, @CurrentUser() user: User) {
    return this.attemptsService.start(dto.testId, { id: user.id, role: user.role });
  }

  @Post(':id/answer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save (or update) a single answer for an attempt' })
  async saveAnswer(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SubmitAnswerDto,
    @CurrentUser() user: User,
  ) {
    return this.attemptsService.saveAnswer(id, dto, { id: user.id, role: user.role });
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Submit the attempt. MCQ-only attempts are auto-graded; mixed/text attempts are flagged for manual grading.',
  })
  async submit(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SubmitAttemptDto,
    @CurrentUser() user: User,
  ) {
    return this.attemptsService.submit(id, dto, { id: user.id, role: user.role });
  }
}
