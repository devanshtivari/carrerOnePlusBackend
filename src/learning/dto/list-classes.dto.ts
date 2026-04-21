import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { PaginationQueryDto } from '../../catalog/dto/pagination.dto';

export class ListClassesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Free-text search across name, code, school' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  schoolName?: string;
}
