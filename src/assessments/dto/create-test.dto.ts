import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TestStatus, TestType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTestDto {
  @ApiProperty({ description: 'Public test code (e.g. TEST-001)' })
  @IsString()
  @Matches(/^[A-Z0-9-]+$/i, { message: 'code must be alphanumeric/hyphens only' })
  @Length(2, 64)
  code!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Free-text course label (e.g. "Class 6 AI & Robotics")' })
  @IsOptional()
  @IsString()
  courseLabel?: string;

  @ApiPropertyOptional({ description: 'Linked Course id (optional)' })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalMarks?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalQuestions?: number;

  @ApiPropertyOptional({ enum: TestType })
  @IsOptional()
  @IsEnum(TestType)
  type?: TestType;

  @ApiPropertyOptional({ enum: TestStatus })
  @IsOptional()
  @IsEnum(TestStatus)
  status?: TestStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
