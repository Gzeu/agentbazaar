import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import {
  RegisterServiceDto,
  UpdateServiceDto,
  ServiceFilterDto,
} from './dto/service.dto';

@ApiTags('Services')
@Controller('api/v1/services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new service on AgentBazaar' })
  @ApiResponse({ status: 201, description: 'Service registered successfully' })
  async registerService(@Body() dto: RegisterServiceDto) {
    return this.servicesService.registerService(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List services with optional filters' })
  async listServices(@Query() filters: ServiceFilterDto) {
    return this.servicesService.listServices(filters);
  }

  @Get(':serviceId')
  @ApiOperation({ summary: 'Get service by ID' })
  async getService(@Param('serviceId') serviceId: string) {
    return this.servicesService.getService(serviceId);
  }

  @Put(':serviceId')
  @ApiOperation({ summary: 'Update service descriptor or pricing' })
  async updateService(
    @Param('serviceId') serviceId: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.updateService(serviceId, dto);
  }

  @Delete(':serviceId')
  @ApiOperation({ summary: 'Deregister a service' })
  async deregisterService(@Param('serviceId') serviceId: string) {
    return this.servicesService.deregisterService(serviceId);
  }

  @Get(':serviceId/quote')
  @ApiOperation({ summary: 'Get a price quote for a service request' })
  async getQuote(
    @Param('serviceId') serviceId: string,
    @Query('payload') payload: string,
  ) {
    return this.servicesService.getQuote(serviceId, payload);
  }
}
