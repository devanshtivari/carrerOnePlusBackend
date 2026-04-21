import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { LessonType } from '@prisma/client';

export class CreateLessonDto {
  @IsUUID('4')
  chapterId!: string;

  @IsString()
  @Length(2, 200)
  title!: string;

  @IsOptional()
  @IsEnum(LessonType)
  type?: LessonType;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  durationLabel?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  position!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  contentUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  body?: string;
}
