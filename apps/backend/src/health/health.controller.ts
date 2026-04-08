import { Controller, Get } from '@nestjs/common';
import { MultiversxService } from '../multiversx/multiversx.service';

@Controller('health')
export class HealthController {
  constructor(private readonly mvx: MultiversxService) {}

  @Get()
  async health() {
    const network = await this.mvx.getNetworkStatus();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      network: 'devnet',
      contracts: this.mvx.addresses,
      contractsConfigured: this.mvx.isConfigured(),
      multiversxReachable: Boolean(network),
    };
  }
}
