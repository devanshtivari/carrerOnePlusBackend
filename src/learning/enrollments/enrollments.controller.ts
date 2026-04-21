import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EnrollDto } from '../dto/enroll.dto';
import { ListEnrollmentsQueryDto } from '../dto/list-enrollments.dto';
import { EnrollmentsService } from './enrollments.service';

@ApiTags('Learning · Enrollments')
@Controller('enrollments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get()
  @ApiOperation({
    summary: 'List enrollments (own for students/instructors, all for admin)',
  })
  async list(
    @Query() query: ListEnrollmentsQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.enrollmentsService.list(query, { id: user.id, role: user.role });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an enrollment by id' })
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ) {
    return this.enrollmentsService.findById(id, { id: user.id, role: user.role });
  }

  @Post()
  @ApiOperation({ summary: 'Enroll the current user in a course' })
  async enroll(@Body() dto: EnrollDto, @CurrentUser() user: User) {
    return this.enrollmentsService.enroll(dto, { id: user.id, role: user.role });
  }

  @Post(':id/touch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update lastAccessAt for an enrollment' })
  async touch(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ) {
    return this.enrollmentsService.touchLastAccess(id, { id: user.id, role: user.role });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw from / soft-delete an enrollment' })
  async withdraw(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ) {
    return this.enrollmentsService.withdraw(id, { id: user.id, role: user.role });
  }
}
