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
import { UserRole } from '@prisma/client';

import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateQuestionDto, UpdateQuestionDto } from '../dto/question.dto';
import { QuestionsService } from './questions.service';

@ApiTags('Assessments · Questions')
@Controller()
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Public()
  @Get('tests/:testId/questions')
  @ApiOperation({ summary: 'List questions for a test (in position order)' })
  async listForTest(@Param('testId', new ParseUUIDPipe()) testId: string) {
    return this.questionsService.listForTest(testId);
  }

  @Public()
  @Get('questions/:id')
  @ApiOperation({ summary: 'Fetch a question by id' })
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.questionsService.findById(id);
  }

  @Post('tests/:testId/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new question to a test' })
  async create(
    @Param('testId', new ParseUUIDPipe()) testId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.questionsService.create(testId, dto);
  }

  @Patch('questions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a question (and optionally replace options)' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(id, dto);
  }

  @Delete('questions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a question' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.questionsService.remove(id);
  }
}
