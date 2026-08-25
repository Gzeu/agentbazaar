import { Module } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';
import { DiscoveryController } from './discovery.controller';
import { ServicesModule } from '../services/services.module';
import { MultiversxModule } from '../multiversx/multiversx.module';

@Module({
  imports:     [ServicesModule, MultiversxModule],
  providers:   [DiscoveryService],
  controllers: [DiscoveryController],
  exports:     [DiscoveryService],
})
export class DiscoveryModule {}
