import { Module, Global } from '@nestjs/common';
import { MultiversxService } from './multiversx.service';

@Global()
@Module({
  providers: [MultiversxService],
  exports: [MultiversxService],
})
export class MultiversxModule {}
