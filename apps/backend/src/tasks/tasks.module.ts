import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { MultiversxModule } from '../multiversx/multiversx.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [MultiversxModule, ServicesModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
