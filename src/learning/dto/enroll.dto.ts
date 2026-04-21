import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class EnrollDto {
  @ApiProperty({ description: 'Course id to enroll in' })
  @IsUUID()
  courseId!: string;
}
