import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { AgentExecutorService } from './agent-executor.service';
import { MultiversxModule } from '../multiversx/multiversx.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports:     [MultiversxModule, ServicesModule],
  providers:   [TasksService, AgentExecutorService],
  controllers: [TasksController],
  exports:     [TasksService, AgentExecutorService],
})
export class TasksModule {}
