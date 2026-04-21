import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

import { PaginationQueryDto } from '../../catalog/dto/pagination.dto';

export class CreateFeedbackDto {
  @ApiProperty()
  @IsUUID()
  studentId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  body!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sectionLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gradeLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contextType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contextId?: string;
}

export class UpdateFeedbackDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sectionLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gradeLabel?: string;
}

export class ListFeedbackDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contextType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contextId?: string;
}
