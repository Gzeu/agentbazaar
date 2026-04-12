import { Controller, Get, Query } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('discovery')
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly svc: DiscoveryService) {}

  @Get()
  @ApiOperation({ summary: 'Discover services by filter criteria' })
  @ApiQuery({ name: 'category',    required: false })
  @ApiQuery({ name: 'maxLatency',  required: false, type: Number })
  @ApiQuery({ name: 'minScore',    required: false, type: Number })
  @ApiQuery({ name: 'mcpRequired', required: false, type: Boolean })
  discover(
    @Query('category')    category?:    string,
    @Query('maxLatency')  maxLatency?:  string,
    @Query('minScore')    minScore?:    string,
    @Query('mcpRequired') mcpRequired?: string,
  ) {
    return this.svc.discover({
      category,
      maxLatencyMs: maxLatency ? Number(maxLatency) : undefined,
      minScore:     minScore   ? Number(minScore)   : undefined,
      ucpRequired:  true,
      mcpRequired:  mcpRequired === 'true',
    });
  }

  /**
   * UCP-standard service catalog endpoint.
   * AI agents (Claude, Cursor, OpenClaw, etc.) can hit this URL
   * to discover all available services, pricing, and how to pay via x402.
   *
   * Example: GET /discovery/ucp
   */
  @Get('ucp')
  @ApiOperation({
    summary: 'UCP service catalog — machine-readable for AI agents',
    description:
      'Returns all services in UCP/1.0 format. ' +
      'AI agents use this to discover services, get pricing, ' +
      'and initiate x402 escrow payments before calling provider endpoints.',
  })
  async ucpCatalog() {
    return this.svc.getUcpCatalog();
  }

  /**
   * UCP well-known endpoint — standard path for agent discovery.
   * Some UCP clients look for /.well-known/ucp by convention.
   */
  @Get('well-known')
  @ApiOperation({ summary: 'UCP well-known alias' })
  async wellKnown() {
    return this.svc.getUcpCatalog();
  }
}
