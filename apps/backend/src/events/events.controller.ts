import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EventsGateway } from './events.gateway';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly gateway: EventsGateway) {}

  @Get()
  @ApiOperation({ summary: 'Get recent chain & task events (last N, max 100)' })
  getRecent(
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
  ) {
    return {
      events: this.gateway.getRecentEvents(Math.min(limit, 100)),
      wsEndpoint: 'ws://<host>/events',
    };
  }
}
