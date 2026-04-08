import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { MultiversxModule } from '../multiversx/multiversx.module';
import { ReputationModule } from '../reputation/reputation.module';

@Module({
  imports: [MultiversxModule, ReputationModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
