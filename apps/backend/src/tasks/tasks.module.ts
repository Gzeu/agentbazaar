import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { ReputationModule } from '../reputation/reputation.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [ReputationModule, ServicesModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
