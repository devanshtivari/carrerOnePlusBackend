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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User, UserRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AddClassMemberDto } from '../dto/add-class-member.dto';
import { CreateClassDto } from '../dto/create-class.dto';
import { ListClassesQueryDto } from '../dto/list-classes.dto';
import { UpdateClassDto } from '../dto/update-class.dto';
import { ClassesService } from './classes.service';

@ApiTags('Learning · Classes')
@Controller('classes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  @ApiOperation({
    summary: 'List classes (own memberships for non-admin, all for admin)',
  })
  async list(
    @Query() query: ListClassesQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.classesService.list(query, { id: user.id, role: user.role });
  }

  @Get('me')
  @ApiOperation({ summary: 'Memberships for the current user' })
  async myMemberships(@CurrentUser() user: User) {
    return this.classesService.listMine({ id: user.id, role: user.role });
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Find a class by its code' })
  async findByCode(@Param('code') code: string, @CurrentUser() user: User) {
    return this.classesService.findByCode(code, { id: user.id, role: user.role });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a class by id' })
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ) {
    return this.classesService.findById(id, { id: user.id, role: user.role });
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List class members' })
  async listMembers(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ) {
    return this.classesService.listMembers(id, { id: user.id, role: user.role });
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a class (admin only)' })
  async create(@Body() dto: CreateClassDto) {
    return this.classesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a class (admin only)' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateClassDto,
  ) {
    return this.classesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a class (admin only)' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.classesService.remove(id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member to a class (admin or class teacher)' })
  async addMember(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddClassMemberDto,
    @CurrentUser() user: User,
  ) {
    return this.classesService.addMember(id, dto, { id: user.id, role: user.role });
  }

  @Delete('memberships/:membershipId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a class membership (admin or class teacher)' })
  async removeMember(
    @Param('membershipId', new ParseUUIDPipe()) membershipId: string,
    @CurrentUser() user: User,
  ) {
    return this.classesService.removeMember(membershipId, {
      id: user.id,
      role: user.role,
    });
  }
}
