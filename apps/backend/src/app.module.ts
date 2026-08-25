import { Module, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule }      from './auth/auth.module';
import { MultiversxModule } from './multiversx/multiversx.module';
import { ServicesModule }  from './services/services.module';
import { TasksModule }     from './tasks/tasks.module';
import { ReputationModule } from './reputation/reputation.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { HealthModule } from './health/health.module';
import { EventsModule } from './events/events.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TasksService } from './tasks/tasks.service';
import { ReputationService } from './reputation/reputation.service';
import { ServicesService } from './services/services.service';
import { McpContractService } from './multiversx/mcp-contract.service';

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

    // Wire SC-MCP on-chain integration (optional flows inside TasksService)
    const mcp = this.moduleRef.get(McpContractService, { strict: false });
    const cfg = this.moduleRef.get(ConfigService as never, { strict: false });
    tasks.setMcpDependencies(mcp, cfg);
  }
}
