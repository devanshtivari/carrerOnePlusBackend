import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User, UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

class PageQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

@ApiTags('Profile')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @Get('me')
  @ApiOperation({ summary: 'Current user profile' })
  async me(@CurrentUser() user: User) {
    return this.service.getMe({ id: user.id, role: user.role });
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.service.updateMe({ id: user.id, role: user.role }, dto);
  }

  @Get('staff')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Paginated list of instructors/admins' })
  async listStaff(@Query() query: PageQuery) {
    return this.service.listStaff(query.page ?? 1, query.pageSize ?? 20);
  }

  @Get('students')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Paginated list of students' })
  async listStudents(@Query() query: PageQuery) {
    return this.service.listStudents(query.page ?? 1, query.pageSize ?? 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a profile by id' })
  async findById(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: User) {
    return this.service.findById(id, { id: user.id, role: user.role });
  }
}
