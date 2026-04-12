import { Module } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { ReputationController } from './reputation.controller';
import { MultiversxModule } from '../multiversx/multiversx.module';

@Module({
  imports:     [MultiversxModule],
  providers:   [ReputationService],
  controllers: [ReputationController],
  exports:     [ReputationService],
})
export class ReputationModule {}
