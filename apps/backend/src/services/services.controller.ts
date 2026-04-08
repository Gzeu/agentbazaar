import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly svc: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'List all services' })
  findAll(@Query('category') category?: string, @Query('limit') limit = '50') {
    return this.svc.findAll({ category, limit: Number(limit) });
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
}
