import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubmissionStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateAssignmentSubmissionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  fileUrl?: string;
}

export class GradeAssignmentSubmissionDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  marksAwarded!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  totalMarks!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gradeLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiPropertyOptional({ enum: SubmissionStatus, default: SubmissionStatus.GRADED })
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;
}
