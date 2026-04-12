import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly svc: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'List services with optional filters' })
  findAll(
    @Query('category') category?: string,
    @Query('tags') tags?: string,
    @Query('search') search?: string,
    @Query('limit') limit = '50',
  ) {
    return this.svc.findAll({
      category,
      tags:   tags ? tags.split(',').map(t => t.trim()) : undefined,
      search,
      limit:  Number(limit),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new service' })
  create(@Body() body: Record<string, unknown>) {
    return this.svc.create(body);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a service' })
  deactivate(@Param('id') id: string) {
    return this.svc.deactivate(id);
  }
}
