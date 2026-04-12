import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService }    from './tasks.service';
import { TimeoutService }  from './timeout.service';
import { MultiversxModule } from '../multiversx/multiversx.module';
import { ServicesModule }   from '../services/services.module';
import { EventsModule }     from '../events/events.module';

@Module({
  imports:     [MultiversxModule, ServicesModule, EventsModule],
  controllers: [TasksController],
  providers:   [TasksService, TimeoutService],
  exports:     [TasksService],
})
export class TasksModule {}
