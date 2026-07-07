import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly svc: ServicesService) {}

  /**
   * GET /api/v1/services?category=data&limit=50&active=true
   */
  @Get()
  @ApiOperation({ summary: 'List services with optional filters' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'limit',    required: false, example: 50 })
  @ApiQuery({ name: 'active',   required: false, example: true })
  findAll(
    @Query('category') category?: string,
    @Query('limit')    limit = '50',
    @Query('active')   active?: string,
  ) {
    return this.svc.findAll({
      category,
      limit: Number(limit),
      activeOnly: active === 'true',
    });
  }

  /**
   * GET /api/v1/services/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  /**
   * POST /api/v1/services
   * Body validated by CreateServiceDto (class-validator)
   */
  @Post()
  @ApiOperation({ summary: 'Register a new agent service' })
  create(@Body() dto: CreateServiceDto) {
    return this.svc.create(dto);
  }

  /**
   * DELETE /api/v1/services/:id
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Deregister (soft-delete) a service' })
  remove(@Param('id') id: string) {
    return this.svc.deregister(id);
  }
}
