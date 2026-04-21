import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaderboardScope } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListLeaderboardQueryDto {
  @ApiProperty({ enum: LeaderboardScope })
  @IsEnum(LeaderboardScope)
  scope!: LeaderboardScope;

  @ApiPropertyOptional({
    description:
      'Scope key (e.g. classId for CLASS, schoolName for SCHOOL). Required for CLASS/SCHOOL scopes.',
  })
  @IsOptional()
  @IsString()
  scopeKey?: string;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
