import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '../../catalog/dto/pagination.dto';

export class ListEnrollmentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by user (admin only)' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by course' })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Only completed enrollments' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  completed?: boolean;
}
