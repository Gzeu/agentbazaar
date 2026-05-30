import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WarpsController } from './warps.controller';
import { WarpsService } from './warps.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
  ],
  controllers: [WarpsController],
  providers:   [WarpsService],
  exports:     [WarpsService],
})
export class WarpsModule {}
