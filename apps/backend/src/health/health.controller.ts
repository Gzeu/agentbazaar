import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MultiversxService } from '../multiversx/multiversx.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly mvx: MultiversxService) {}

  @Get()
  @ApiOperation({ summary: 'Service liveness + chain connectivity check' })
  async health() {
    const network = await this.mvx.getNetworkStatus();
    return {
      status:              'ok',
      timestamp:           new Date().toISOString(),
      version:             process.env.npm_package_version ?? '0.1.0',
      network:             this.mvx.NETWORK,
      contracts:           this.mvx.addresses,
      contractsConfigured: this.mvx.isConfigured(),
      multiversxReachable: Boolean(network),
    };
  }
}
