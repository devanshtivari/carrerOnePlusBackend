import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportKind } from '@prisma/client';
import { IsEnum, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

import { PaginationQueryDto } from '../../catalog/dto/pagination.dto';

export class CreateReportDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiPropertyOptional({ enum: ReportKind })
  @IsOptional()
  @IsEnum(ReportKind)
  kind?: ReportKind;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iconName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

export class UpdateReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: ReportKind })
  @IsOptional()
  @IsEnum(ReportKind)
  kind?: ReportKind;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iconName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

export class ListReportsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ReportKind })
  @IsOptional()
  @IsEnum(ReportKind)
  kind?: ReportKind;
}
