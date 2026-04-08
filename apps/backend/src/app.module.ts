import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ServicesModule } from './services/services.module';
import { TasksModule } from './tasks/tasks.module';
import { ReputationModule } from './reputation/reputation.module';
import { MultiversxModule } from './multiversx/multiversx.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { HealthModule } from './health/health.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    MultiversxModule,
    ServicesModule,
    TasksModule,
    ReputationModule,
    DiscoveryModule,
    HealthModule,
    EventsModule,
  ],
})
export class AppModule {}
