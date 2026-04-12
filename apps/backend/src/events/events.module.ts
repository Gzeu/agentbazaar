import { Module } from '@nestjs/common';
import { EventPoller } from './event.poller';
import { EventsGateway } from './events.gateway';
import { EventsController } from './events.controller';
import { MultiversxModule } from '../multiversx/multiversx.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports:   [MultiversxModule, TasksModule],
  providers: [EventPoller, EventsGateway],
  controllers: [EventsController],
})
export class EventsModule {}
