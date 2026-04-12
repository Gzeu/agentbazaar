import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly svc: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'List registered services' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'limit', required: false, description: 'Default 50, max 100' })
  findAll(
    @Query('category') category?: string,
    @Query('limit') limit = '50',
  ) {
    return this.svc.findAll({ category, limit: Math.min(Number(limit), 100) });
    // returns { services: ServiceRecord[], total: number }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a service by ID' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new service (post on-chain TX)' })
  create(@Body() body: Record<string, unknown>) {
    return this.svc.create(body);
  }
}
