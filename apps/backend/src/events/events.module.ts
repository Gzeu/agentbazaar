import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { EventPoller } from './event.poller';
import { MultiversxModule } from '../multiversx/multiversx.module';

@Module({
  imports: [MultiversxModule],
  providers: [EventsGateway, EventPoller],
  exports: [EventsGateway],
})
export class EventsModule {}
