import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClassMembershipRole } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class AddClassMemberDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ enum: ClassMembershipRole })
  @IsOptional()
  @IsEnum(ClassMembershipRole)
  role?: ClassMembershipRole;
}
