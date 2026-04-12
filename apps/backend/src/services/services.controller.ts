import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ServicesService } from './services.service';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'List registered AI services' })
  @ApiQuery({ name: 'limit',    required: false, example: 50 })
  @ApiQuery({ name: 'category', required: false, example: 'data' })
  findAll(
    @Query('limit')    limit    = '50',
    @Query('category') category?: string,
  ) {
    return this.services.findAll({ limit: Number(limit), category });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single service by ID' })
  @ApiParam({ name: 'id', example: 'svc-abc12345' })
  findOne(@Param('id') id: string) {
    return this.services.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new AI service' })
  create(@Body() body: Record<string, unknown>) {
    return this.services.create(body);
  }
}
