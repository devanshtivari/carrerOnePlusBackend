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
import { ChaptersService } from './chapters.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';

@ApiTags('Catalog · Chapters')
@Controller()
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Public()
  @Get('units/:unitId/chapters')
  @ApiOperation({ summary: 'List chapters for a unit' })
  async listByUnit(@Param('unitId', new ParseUUIDPipe()) unitId: string) {
    return this.chaptersService.listByUnit(unitId);
  }

  @Public()
  @Get('chapters/:id')
  @ApiOperation({ summary: 'Fetch a chapter by id' })
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.chaptersService.findById(id);
  }

  @Post('chapters')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a chapter (admin or owning instructor)' })
  async create(@Body() dto: CreateChapterDto, @CurrentUser() user: User) {
    return this.chaptersService.create(dto, { id: user.id, role: user.role });
  }

  @Patch('chapters/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a chapter (admin or owning instructor)' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateChapterDto,
    @CurrentUser() user: User,
  ) {
    return this.chaptersService.update(id, dto, { id: user.id, role: user.role });
  }

  @Delete('chapters/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a chapter (admin or owning instructor)' })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ) {
    return this.chaptersService.remove(id, { id: user.id, role: user.role });
  }
}
