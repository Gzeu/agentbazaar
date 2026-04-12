import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { MultiversxModule } from '../multiversx/multiversx.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [MultiversxModule, TasksModule],
  controllers: [HealthController],
})
export class HealthModule {}
