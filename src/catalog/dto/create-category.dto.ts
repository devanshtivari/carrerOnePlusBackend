import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Matches, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @Length(2, 80)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must contain only lowercase letters, numbers, and dashes',
  })
  slug!: string;

  @IsString()
  @Length(2, 120)
  label!: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  iconName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position?: number;
}
