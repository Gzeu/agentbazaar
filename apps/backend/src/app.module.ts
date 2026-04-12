import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule }      from './auth/auth.module';
import { MultiversxModule } from './multiversx/multiversx.module';
import { ServicesModule }  from './services/services.module';
import { TasksModule }     from './tasks/tasks.module';
import { ReputationModule } from './reputation/reputation.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { HealthModule }    from './health/health.module';
import { EventsModule }    from './events/events.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    AuthModule,
    MultiversxModule,
    ServicesModule,
    TasksModule,
    ReputationModule,
    DiscoveryModule,
    HealthModule,
    EventsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
