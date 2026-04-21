import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubmissionStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProjectSubmissionDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  fileName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileSize?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  fileUrl?: string;
}

export class GradeProjectSubmissionDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  marksAwarded!: number;

  @ApiPropertyOptional({ enum: SubmissionStatus, default: SubmissionStatus.GRADED })
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;
}
