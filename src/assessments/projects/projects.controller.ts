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
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateProjectDto } from '../dto/create-project.dto';
import { ListProjectsDto } from '../dto/list-projects.dto';
import {
  CreateProjectSubmissionDto,
  GradeProjectSubmissionDto,
} from '../dto/project-submission.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('Assessments · Projects')
@Controller()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Public()
  @Get('projects')
  @ApiOperation({ summary: 'List projects (paginated, filterable)' })
  async list(@Query() query: ListProjectsDto) {
    return this.projectsService.list(query);
  }

  @Public()
  @Get('units/:unitId/projects')
  @ApiOperation({ summary: 'List projects for a unit (no pagination)' })
  async listForUnit(@Param('unitId', new ParseUUIDPipe()) unitId: string) {
    return this.projectsService.listForUnit(unitId);
  }

  @Public()
  @Get('courses/:courseId/projects')
  @ApiOperation({ summary: 'List projects for a course (no pagination)' })
  async listForCourse(@Param('courseId', new ParseUUIDPipe()) courseId: string) {
    return this.projectsService.listForCourse(courseId);
  }

  @Public()
  @Get('projects/:id')
  @ApiOperation({ summary: 'Fetch a project by id' })
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.projectsService.findById(id);
  }

  @Post('projects')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a project (admin/instructor)' })
  async create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Patch('projects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a project (admin/instructor)' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, dto);
  }

  @Delete('projects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a project' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.projectsService.remove(id);
  }

  // ─── Submissions ──────────────────────────────────────────────────────────

  @Post('projects/:id/submissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit (or re-submit) the current user’s submission' })
  async submit(
    @Param('id', new ParseUUIDPipe()) projectId: string,
    @Body() dto: CreateProjectSubmissionDto,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.submit(projectId, dto, { id: user.id, role: user.role });
  }

  @Get('projects/:id/submissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'List submissions for a project (own only for students; all for instructors/admins)',
  })
  async listSubmissions(
    @Param('id', new ParseUUIDPipe()) projectId: string,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.listSubmissions(projectId, { id: user.id, role: user.role });
  }

  @Get('project-submissions/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List the current user’s project submissions' })
  async listMine(@CurrentUser() user: User) {
    return this.projectsService.listMySubmissions({ id: user.id, role: user.role });
  }

  @Patch('project-submissions/:submissionId/grade')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Grade a project submission (admin/instructor)' })
  async grade(
    @Param('submissionId', new ParseUUIDPipe()) submissionId: string,
    @Body() dto: GradeProjectSubmissionDto,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.grade(submissionId, dto, { id: user.id, role: user.role });
  }

  @Delete('project-submissions/:submissionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw a project submission' })
  async withdrawSubmission(
    @Param('submissionId', new ParseUUIDPipe()) submissionId: string,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.withdrawSubmission(submissionId, {
      id: user.id,
      role: user.role,
    });
  }
}
