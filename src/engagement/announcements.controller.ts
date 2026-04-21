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
import { AnnouncementAudience, User, UserRole } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AnnouncementsService } from './announcements.service';
import {
  CreateAnnouncementDto,
  ListAnnouncementsDto,
  UpdateAnnouncementDto,
} from './dto/announcement.dto';

@ApiTags('Engagement · Announcements')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List announcements (public, optional audience filter)' })
  async list(@Query() query: ListAnnouncementsDto) {
    return this.service.list(query);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Announcements scoped to the current user role' })
  async listForMe(@Query() query: ListAnnouncementsDto, @CurrentUser() user: User) {
    const audience =
      user.role === UserRole.STUDENT
        ? AnnouncementAudience.STUDENT
        : user.role === UserRole.INSTRUCTOR
          ? AnnouncementAudience.INSTRUCTOR
          : AnnouncementAudience.ALL;
    return this.service.list(query, audience);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Fetch an announcement by id' })
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an announcement (admin or instructor)' })
  async create(@Body() dto: CreateAnnouncementDto, @CurrentUser() user: User) {
    return this.service.create(dto, { id: user.id, role: user.role });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an announcement' })
  async update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete an announcement' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.remove(id);
  }
}
