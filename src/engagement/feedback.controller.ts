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
import { CreateFeedbackDto, ListFeedbackDto, UpdateFeedbackDto } from './dto/feedback.dto';
import { FeedbackService } from './feedback.service';

@ApiTags('Engagement · Feedback')
@Controller('feedback')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeedbackController {
  constructor(private readonly service: FeedbackService) {}

  @Get()
  @ApiOperation({ summary: 'List feedback (students see own, staff see all)' })
  async list(@Query() query: ListFeedbackDto, @CurrentUser() user: User) {
    return this.service.list(query, { id: user.id, role: user.role });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a feedback entry' })
  async findById(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: User) {
    return this.service.findById(id, { id: user.id, role: user.role });
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Create feedback for a student' })
  async create(@Body() dto: CreateFeedbackDto, @CurrentUser() user: User) {
    return this.service.create(dto, { id: user.id, role: user.role });
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Update feedback (author only)' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateFeedbackDto,
    @CurrentUser() user: User,
  ) {
    return this.service.update(id, dto, { id: user.id, role: user.role });
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Soft-delete feedback (author only)' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: User) {
    return this.service.remove(id, { id: user.id, role: user.role });
  }
}
