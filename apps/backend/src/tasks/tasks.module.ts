import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { MultiversxModule } from '../multiversx/multiversx.module';

@Module({
  imports:     [MultiversxModule],
  providers:   [TasksService],
  controllers: [TasksController],
  exports:     [TasksService],
})
export class TasksModule {}
