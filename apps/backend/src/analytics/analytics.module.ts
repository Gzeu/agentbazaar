import { Module }            from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService }    from './analytics.service';
import { TasksModule }         from '../tasks/tasks.module';
import { ServicesModule }      from '../services/services.module';
import { ReputationModule }    from '../reputation/reputation.module';

@Module({
  imports:     [TasksModule, ServicesModule, ReputationModule],
  controllers: [AnalyticsController],
  providers:   [AnalyticsService],
  exports:     [AnalyticsService],
})
export class AnalyticsModule {}
