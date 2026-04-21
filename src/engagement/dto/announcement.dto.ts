import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnnouncementAudience } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';

import { PaginationQueryDto } from '../../catalog/dto/pagination.dto';

/**
 * Normalise audience values that clients sometimes pluralise (e.g.
 * `STUDENTS` / `INSTRUCTORS`) or lowercase. We accept those aliases and map
 * them onto the canonical `AnnouncementAudience` enum so the UI doesn't have
 * to know the exact enum spelling.
 */
function normaliseAudience(
  value: unknown,
): AnnouncementAudience | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const raw = String(value).trim().toUpperCase();
  switch (raw) {
    case 'ALL':
      return AnnouncementAudience.ALL;
    case 'STUDENT':
    case 'STUDENTS':
      return AnnouncementAudience.STUDENT;
    case 'INSTRUCTOR':
    case 'INSTRUCTORS':
    case 'TEACHER':
    case 'TEACHERS':
      return AnnouncementAudience.INSTRUCTOR;
    default:
      return raw as AnnouncementAudience;
  }
}

function normaliseBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  const raw = String(value).trim().toLowerCase();
  if (raw === 'true' || raw === '1' || raw === 'yes') return true;
  if (raw === 'false' || raw === '0' || raw === 'no') return false;
  return undefined;
}

export class CreateAnnouncementDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: AnnouncementAudience })
  @IsOptional()
  @IsEnum(AnnouncementAudience)
  audience?: AnnouncementAudience;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryCtaText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  primaryCtaUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  secondaryCtaText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  secondaryCtaUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sponsorName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  themeColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAnnouncementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: AnnouncementAudience })
  @IsOptional()
  @IsEnum(AnnouncementAudience)
  audience?: AnnouncementAudience;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryCtaText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  primaryCtaUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  secondaryCtaText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  secondaryCtaUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sponsorName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  themeColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ListAnnouncementsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: AnnouncementAudience,
    description:
      'Canonical values are ALL / STUDENT / INSTRUCTOR. Aliases "STUDENTS", "INSTRUCTORS", and "TEACHERS" are accepted for backwards compatibility.',
  })
  @IsOptional()
  @Transform(({ value }) => normaliseAudience(value))
  @IsEnum(AnnouncementAudience)
  audience?: AnnouncementAudience;

  @ApiPropertyOptional({ description: 'Only return active announcements' })
  @IsOptional()
  @Transform(({ value }) => normaliseBoolean(value))
  @IsBoolean()
  isActive?: boolean;

  /**
   * Legacy alias used by the frontend — mapped onto `isActive` before
   * validation runs so the two are interchangeable.
   */
  @ApiPropertyOptional({ description: 'Alias for `isActive`' })
  @IsOptional()
  @Transform(({ value }) => normaliseBoolean(value))
  @IsBoolean()
  activeOnly?: boolean;
}
