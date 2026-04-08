import { Module } from '@nestjs/common';
import { MultiversxService } from './multiversx.service';

@Module({
  providers: [MultiversxService],
  exports: [MultiversxService],
})
export class MultiversxModule {}
