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
import { CalendarEventsService } from './calendar-events.service';
import {
  CreateCalendarEventDto,
  ListCalendarEventsDto,
  UpdateCalendarEventDto,
} from './dto/calendar-event.dto';

@ApiTags('Engagement · Calendar Events')
@Controller('calendar-events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CalendarEventsController {
  constructor(private readonly service: CalendarEventsService) {}

  @Get()
  @ApiOperation({ summary: 'List calendar events (date-range filterable)' })
  async list(@Query() query: ListCalendarEventsDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a calendar event' })
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Create a calendar event' })
  async create(@Body() dto: CreateCalendarEventDto, @CurrentUser() user: User) {
    return this.service.create(dto, { id: user.id, role: user.role });
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Update a calendar event' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCalendarEventDto,
    @CurrentUser() user: User,
  ) {
    return this.service.update(id, dto, { id: user.id, role: user.role });
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Soft-delete a calendar event' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: User) {
    return this.service.remove(id, { id: user.id, role: user.role });
  }
}
