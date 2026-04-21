import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { CourseLevel } from '@prisma/client';

import { PaginationQueryDto } from './pagination.dto';

export type CourseSortField = 'createdAt' | 'title' | 'ratingAvg' | 'ratingCount';
export const COURSE_SORT_FIELDS: CourseSortField[] = [
  'createdAt',
  'title',
  'ratingAvg',
  'ratingCount',
];

export class ListCoursesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @Length(1, 80)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  category?: string; // category slug

  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(COURSE_SORT_FIELDS)
  sortBy?: CourseSortField = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsUUID('4')
  instructorId?: string;

  /**
   * Grade level to filter courses by (e.g. "6", "10"). The service maps this
   * to a `grade:<n>` tag lookup — see seeder `buildTagList()` for the full
   * convention.
   */
  @IsOptional()
  @IsString()
  @MaxLength(5)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  grade?: string;
}
