import { Module, forwardRef } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { ReputationModule } from '../reputation/reputation.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [forwardRef(() => ReputationModule), forwardRef(() => EventsModule)],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
