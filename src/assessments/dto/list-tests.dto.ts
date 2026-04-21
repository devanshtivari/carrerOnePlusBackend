import { ApiPropertyOptional } from '@nestjs/swagger';
import { TestStatus, TestType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../catalog/dto/pagination.dto';

export class ListTestsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TestStatus })
  @IsOptional()
  @IsEnum(TestStatus)
  status?: TestStatus;

  @ApiPropertyOptional({ enum: TestType })
  @IsOptional()
  @IsEnum(TestType)
  type?: TestType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
