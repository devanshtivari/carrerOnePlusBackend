import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeaderboardScope, User, UserRole } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ListLeaderboardQueryDto } from '../dto/list-leaderboard.dto';
import { LeaderboardService } from './leaderboard.service';

class RecomputeLeaderboardDto {
  @IsEnum(LeaderboardScope)
  scope!: LeaderboardScope;

  @IsOptional()
  @IsString()
  scopeKey?: string;
}

@ApiTags('Learning · Leaderboard')
@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Get a leaderboard scoped to CLASS / SCHOOL / NATIONAL / GLOBAL',
  })
  async list(
    @Query() query: ListLeaderboardQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.leaderboardService.list(query, { id: user.id });
  }

  @Post('recompute')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recompute leaderboard snapshots for a scope (admin)' })
  async recompute(@Body() dto: RecomputeLeaderboardDto) {
    return this.leaderboardService.recompute(dto.scope, dto.scopeKey ?? null);
  }
}
