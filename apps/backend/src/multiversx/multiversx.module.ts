import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MultiversxService } from './multiversx.service';

@Module({
  imports: [ConfigModule],
  providers: [MultiversxService],
  exports: [MultiversxService],
})
export class MultiversxModule {}
