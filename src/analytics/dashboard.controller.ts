import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User, UserRole } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('Analytics · Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('student')
  @ApiOperation({ summary: 'Aggregated student dashboard data for the current user' })
  async studentDashboard(@CurrentUser() user: User) {
    return this.service.studentDashboard({ id: user.id, role: user.role });
  }

  @Get('teacher')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Aggregated teacher dashboard data' })
  async teacherDashboard(@CurrentUser() user: User) {
    return this.service.teacherDashboard({ id: user.id, role: user.role });
  }
}
