import { Module, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
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
import { TasksService } from './tasks/tasks.service';
import { ReputationService } from './reputation/reputation.service';
import { ServicesService } from './services/services.service';

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
export class AppModule implements OnModuleInit {
  constructor(private moduleRef: ModuleRef) {}

  /**
   * Wire TasksService lazy dependencies AFTER all modules have initialised.
   * This avoids the circular-dependency issue with NestJS constructor injection:
   *   TasksModule → ReputationModule → MultiversxModule (no cycle).
   */
  onModuleInit() {
    const tasks = this.moduleRef.get(TasksService,      { strict: false });
    const rep   = this.moduleRef.get(ReputationService, { strict: false });
    const svc   = this.moduleRef.get(ServicesService,   { strict: false });
    tasks.setDependencies(rep, svc);
  }
}
