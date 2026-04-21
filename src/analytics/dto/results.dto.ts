import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrendDirection } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class UpsertSubjectScoreDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  subjectLabel!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000)
  score!: number;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gradeLabel?: string;

  @ApiPropertyOptional({ enum: TrendDirection })
  @IsOptional()
  @IsEnum(TrendDirection)
  trend?: TrendDirection;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trendValue?: string;
}

export class UpsertGrowthDto {
  @ApiProperty({ description: 'Month key like 2026-03' })
  @IsString()
  @MinLength(4)
  monthKey!: string;

  @ApiProperty({ description: 'Display label like "Mar"' })
  @IsString()
  @MinLength(1)
  monthLabel!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000)
  score!: number;
}
