import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { ReputationModule } from '../reputation/reputation.module';
import { ServicesModule } from '../services/services.module';
import { MultiversxModule } from '../multiversx/multiversx.module';

@Module({
  imports: [ReputationModule, ServicesModule, MultiversxModule],
  controllers: [TasksController],
  providers:   [TasksService],
  exports:     [TasksService],
})
export class TasksModule {}
