import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User, UserRole } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UnitsService } from './units.service';

@ApiTags('Catalog · Units')
@Controller()
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Public()
  @Get('courses/:courseId/units')
  @ApiOperation({ summary: 'List units for a course' })
  async listByCourse(@Param('courseId', new ParseUUIDPipe()) courseId: string) {
    return this.unitsService.listByCourse(courseId);
  }

  @Public()
  @Get('units/:id')
  @ApiOperation({ summary: 'Fetch a unit by id' })
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.unitsService.findById(id);
  }

  @Post('units')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a unit (admin or owning instructor)' })
  async create(@Body() dto: CreateUnitDto, @CurrentUser() user: User) {
    return this.unitsService.create(dto, { id: user.id, role: user.role });
  }

  @Patch('units/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a unit (admin or owning instructor)' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUnitDto,
    @CurrentUser() user: User,
  ) {
    return this.unitsService.update(id, dto, { id: user.id, role: user.role });
  }

  @Delete('units/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a unit (admin or owning instructor)' })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ) {
    return this.unitsService.remove(id, { id: user.id, role: user.role });
  }
}
