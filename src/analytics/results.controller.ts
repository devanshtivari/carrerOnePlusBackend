import { Body, Controller, Get, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User, UserRole } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpsertGrowthDto, UpsertSubjectScoreDto } from './dto/results.dto';
import { ResultsService } from './results.service';

@ApiTags('Analytics · Results')
@Controller('results')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ResultsController {
  constructor(private readonly service: ResultsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Aggregated results summary for current user' })
  async myResults(@CurrentUser() user: User) {
    return this.service.getSummary(user.id, { id: user.id, role: user.role });
  }

  @Get('users/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Aggregated results for a specific student (staff only)' })
  async forUser(@Param('userId', new ParseUUIDPipe()) userId: string, @CurrentUser() user: User) {
    return this.service.getSummary(userId, { id: user.id, role: user.role });
  }

  @Put('users/:userId/subject-scores')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Upsert subject score for a student' })
  async upsertSubjectScore(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: UpsertSubjectScoreDto,
    @CurrentUser() user: User,
  ) {
    return this.service.upsertSubjectScore(userId, dto, { id: user.id, role: user.role });
  }

  @Put('users/:userId/growth')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Upsert growth snapshot for a student' })
  async upsertGrowth(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: UpsertGrowthDto,
    @CurrentUser() user: User,
  ) {
    return this.service.upsertGrowth(userId, dto, { id: user.id, role: user.role });
  }
}
