import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { MultiversxModule } from '../multiversx/multiversx.module';

@Module({
  imports: [MultiversxModule],
  controllers: [HealthController],
})
export class HealthModule {}
