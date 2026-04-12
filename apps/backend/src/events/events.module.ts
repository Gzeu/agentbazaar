import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { EventsController } from './events.controller';
import { EventPoller } from './event.poller';
import { MultiversxModule } from '../multiversx/multiversx.module';

@Module({
  imports: [MultiversxModule],
  controllers: [EventsController],
  providers: [EventsGateway, EventPoller],
  exports: [EventsGateway],
})
export class EventsModule {}
