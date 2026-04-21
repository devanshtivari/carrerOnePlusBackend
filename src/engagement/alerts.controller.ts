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
import { AlertsService } from './alerts.service';
import { CreateAlertDto, ListAlertsDto, UpdateAlertDto } from './dto/alert.dto';

@ApiTags('Engagement · Alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
@ApiBearerAuth()
export class AlertsController {
  constructor(private readonly service: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'List alerts (admin or instructor)' })
  async list(@Query() query: ListAlertsDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch an alert by id' })
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new alert' })
  async create(@Body() dto: CreateAlertDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an alert' })
  async update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateAlertDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Resolve an alert' })
  async resolve(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: User) {
    return this.service.resolve(id, { id: user.id, role: user.role });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete an alert' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.remove(id);
  }
}
