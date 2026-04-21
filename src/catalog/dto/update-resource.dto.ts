import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Length, MaxLength, Min } from 'class-validator';
import { ResourceKind } from '@prisma/client';

export class UpdateResourceDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  name?: string;

  @IsOptional()
  @IsEnum(ResourceKind)
  kind?: ResourceKind;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  sizeLabel?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position?: number;
}
