import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { MultiversxModule } from '../multiversx/multiversx.module';

@Module({
  imports:   [MultiversxModule],
  providers: [ServicesService],
  controllers: [ServicesController],
  exports:   [ServicesService],
})
export class ServicesModule {}
