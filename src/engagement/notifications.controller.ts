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
import { CreateNotificationDto, ListNotificationsDto } from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Engagement · Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'List notifications for the current user' })
  async listMine(@Query() query: ListNotificationsDto, @CurrentUser() user: User) {
    return this.service.listForUser(user.id, query);
  }

  @Patch('me/read-all')
  @ApiOperation({ summary: 'Mark all current-user notifications as read' })
  async markAllRead(@CurrentUser() user: User) {
    return this.service.markAllRead({ id: user.id, role: user.role });
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markRead(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: User) {
    return this.service.markRead(id, { id: user.id, role: user.role });
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Create a notification (admin or instructor)' })
  async create(@Body() dto: CreateNotificationDto, @CurrentUser() user: User) {
    return this.service.create(dto, { id: user.id, role: user.role });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: User) {
    return this.service.remove(id, { id: user.id, role: user.role });
  }
}
