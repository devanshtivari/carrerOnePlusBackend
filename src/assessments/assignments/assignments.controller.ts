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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User, UserRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CreateAssignmentSubmissionDto,
  GradeAssignmentSubmissionDto,
} from '../dto/assignment-submission.dto';
import { CreateAssignmentDto } from '../dto/create-assignment.dto';
import { ListAssignmentsDto } from '../dto/list-assignments.dto';
import { UpdateAssignmentDto } from '../dto/update-assignment.dto';
import { AssignmentsService } from './assignments.service';

@ApiTags('Assessments · Assignments')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get('assignments')
  @ApiOperation({ summary: 'List assignments (paginated, filterable)' })
  async list(@Query() query: ListAssignmentsDto) {
    return this.assignmentsService.list(query);
  }

  @Get('classes/:classId/assignments')
  @ApiOperation({ summary: 'List assignments for a class' })
  async listForClass(@Param('classId', new ParseUUIDPipe()) classId: string) {
    return this.assignmentsService.listForClass(classId);
  }

  @Get('assignments/:id')
  @ApiOperation({ summary: 'Fetch an assignment by id' })
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.assignmentsService.findById(id);
  }

  @Post('assignments')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Create an assignment (admin/instructor)' })
  async create(@Body() dto: CreateAssignmentDto) {
    return this.assignmentsService.create(dto);
  }

  @Patch('assignments/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Update an assignment (admin/instructor)' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.assignmentsService.update(id, dto);
  }

  @Delete('assignments/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete an assignment' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.assignmentsService.remove(id);
  }

  // ─── Submissions ──────────────────────────────────────────────────────────

  @Post('assignments/:id/submissions')
  @ApiOperation({ summary: 'Submit (or re-submit) the current user’s submission' })
  async submit(
    @Param('id', new ParseUUIDPipe()) assignmentId: string,
    @Body() dto: CreateAssignmentSubmissionDto,
    @CurrentUser() user: User,
  ) {
    return this.assignmentsService.submit(assignmentId, dto, {
      id: user.id,
      role: user.role,
    });
  }

  @Get('assignments/:id/submissions')
  @ApiOperation({
    summary:
      'List submissions for an assignment (own only for students; all for instructors/admins)',
  })
  async listSubmissions(
    @Param('id', new ParseUUIDPipe()) assignmentId: string,
    @CurrentUser() user: User,
  ) {
    return this.assignmentsService.listSubmissions(assignmentId, {
      id: user.id,
      role: user.role,
    });
  }

  @Get('assignment-submissions/me')
  @ApiOperation({ summary: 'List the current user’s assignment submissions' })
  async listMine(@CurrentUser() user: User) {
    return this.assignmentsService.listMySubmissions({ id: user.id, role: user.role });
  }

  @Patch('assignment-submissions/:submissionId/grade')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Grade an assignment submission (admin/instructor)' })
  async grade(
    @Param('submissionId', new ParseUUIDPipe()) submissionId: string,
    @Body() dto: GradeAssignmentSubmissionDto,
    @CurrentUser() user: User,
  ) {
    return this.assignmentsService.grade(submissionId, dto, { id: user.id, role: user.role });
  }

  @Delete('assignment-submissions/:submissionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw an assignment submission' })
  async withdrawSubmission(
    @Param('submissionId', new ParseUUIDPipe()) submissionId: string,
    @CurrentUser() user: User,
  ) {
    return this.assignmentsService.withdrawSubmission(submissionId, {
      id: user.id,
      role: user.role,
    });
  }
}
