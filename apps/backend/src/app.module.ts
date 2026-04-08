import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServicesModule } from './services/services.module';
import { TasksModule } from './tasks/tasks.module';
import { ReputationModule } from './reputation/reputation.module';
import { MultiversxModule } from './multiversx/multiversx.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MultiversxModule,
    ServicesModule,
    TasksModule,
    ReputationModule,
    DiscoveryModule,
    HealthModule,
  ],
})
export class AppModule {}
