import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';

export class CreateClassDto {
  @ApiProperty({ description: 'Public class code (slug-like)' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/i, { message: 'code must contain only letters, digits and hyphens' })
  @Length(2, 64)
  code!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  section?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  schoolName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
