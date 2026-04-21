import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class StartAttemptDto {
  @ApiProperty({ description: 'Test id to start an attempt for' })
  @IsUUID()
  testId!: string;
}

export class SubmitAnswerDto {
  @ApiProperty()
  @IsUUID()
  questionId!: string;

  @ApiPropertyOptional({ description: 'Selected option label (for MCQ)' })
  @IsOptional()
  @IsString()
  selectedLabel?: string;

  @ApiPropertyOptional({ description: 'Free-text answer (for TEXT/SUBJECTIVE)' })
  @IsOptional()
  @IsString()
  textAnswer?: string;
}

export class SubmitAttemptDto {
  @ApiPropertyOptional({
    type: [SubmitAnswerDto],
    description:
      'Final answer batch to persist alongside submission. Existing answers are upserted.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  @ArrayMinSize(0)
  answers?: SubmitAnswerDto[];
}
