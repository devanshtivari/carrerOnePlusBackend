import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LabRuntimeStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

import { PaginationQueryDto } from '../../catalog/dto/pagination.dto';

export class CreateLabDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ enum: LabRuntimeStatus })
  @IsOptional()
  @IsEnum(LabRuntimeStatus)
  status?: LabRuntimeStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uptimeNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  activeUsers?: number;
}

export class UpdateLabDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: LabRuntimeStatus })
  @IsOptional()
  @IsEnum(LabRuntimeStatus)
  status?: LabRuntimeStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uptimeNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  activeUsers?: number;
}

export class ListLabsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: LabRuntimeStatus })
  @IsOptional()
  @IsEnum(LabRuntimeStatus)
  status?: LabRuntimeStatus;
}
