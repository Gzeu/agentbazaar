import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { RegisterServiceDto, UpdateServiceDto, ServiceFilterDto } from './dto/service.dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly svc: ServicesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterServiceDto) {
    return this.svc.registerService(dto);
  }

  @Get()
  list(@Query() filters: ServiceFilterDto) {
    return this.svc.listServices(filters);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.svc.getService(id);
  }

  @Get(':id/quote')
  quote(@Param('id') id: string) {
    return this.svc.getQuote(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.svc.updateService(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deregister(@Param('id') id: string) {
    return this.svc.deregisterService(id);
  }
}
