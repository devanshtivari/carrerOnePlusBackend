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

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateReportDto, ListReportsDto, UpdateReportDto } from './dto/report.dto';
import { ReportsService } from './reports.service';

@ApiTags('Analytics · Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'List reports owned by the current user (admins see all)' })
  async list(@Query() query: ListReportsDto, @CurrentUser() user: User) {
    return this.service.list(query, { id: user.id, role: user.role });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a report' })
  async findById(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: User) {
    return this.service.findById(id, { id: user.id, role: user.role });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new report' })
  async create(@Body() dto: CreateReportDto, @CurrentUser() user: User) {
    return this.service.create(dto, { id: user.id, role: user.role });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a report' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateReportDto,
    @CurrentUser() user: User,
  ) {
    return this.service.update(id, dto, { id: user.id, role: user.role });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a report' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: User) {
    return this.service.remove(id, { id: user.id, role: user.role });
  }
}
