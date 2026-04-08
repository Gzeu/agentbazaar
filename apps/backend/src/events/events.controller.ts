import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Controller('events')
export class EventsController {
  constructor(private readonly gateway: EventsGateway) {}

  @Get()
  getRecent(
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
  ) {
    return {
      data: this.gateway.getRecentEvents(Math.min(limit, 100)),
      wsEndpoint: '/events',
    };
  }
}
