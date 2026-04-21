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
import { UserRole } from '@prisma/client';

import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateTestDto } from '../dto/create-test.dto';
import { ListTestsDto } from '../dto/list-tests.dto';
import { UpdateTestDto } from '../dto/update-test.dto';
import { TestsService } from './tests.service';

@ApiTags('Assessments · Tests')
@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List tests (paginated, filterable)' })
  async list(@Query() query: ListTestsDto) {
    return this.testsService.list(query);
  }

  @Public()
  @Get('code/:code')
  @ApiOperation({ summary: 'Fetch a test by code' })
  async findByCode(@Param('code') code: string) {
    return this.testsService.findByCode(code);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Fetch a test by id' })
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.testsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new test (admin or instructor)' })
  async create(@Body() dto: CreateTestDto) {
    return this.testsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a test (admin or instructor)' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTestDto,
  ) {
    return this.testsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a test' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.testsService.remove(id);
  }
}
