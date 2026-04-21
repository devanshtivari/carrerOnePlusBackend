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
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ResourcesService } from './resources.service';

@ApiTags('Catalog · Resources')
@Controller()
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Public()
  @Get('units/:unitId/resources')
  @ApiOperation({ summary: 'List resources attached to a unit' })
  async listByUnit(@Param('unitId', new ParseUUIDPipe()) unitId: string) {
    return this.resourcesService.listByUnit(unitId);
  }

  @Public()
  @Get('resources/:id')
  @ApiOperation({ summary: 'Fetch a resource by id' })
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.resourcesService.findById(id);
  }

  @Post('resources')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a resource (admin or owning instructor)' })
  async create(@Body() dto: CreateResourceDto, @CurrentUser() user: User) {
    return this.resourcesService.create(dto, { id: user.id, role: user.role });
  }

  @Patch('resources/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a resource (admin or owning instructor)' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateResourceDto,
    @CurrentUser() user: User,
  ) {
    return this.resourcesService.update(id, dto, { id: user.id, role: user.role });
  }

  @Delete('resources/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a resource (admin or owning instructor)' })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ) {
    return this.resourcesService.remove(id, { id: user.id, role: user.role });
  }
}
