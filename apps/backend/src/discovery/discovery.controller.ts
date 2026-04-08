import { Controller, Get, Query } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('discovery')
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discovery: DiscoveryService) {}

  @Get()
  @ApiOperation({ summary: 'UCP-compatible service discovery endpoint' })
  discover(
    @Query('category') category?: string,
    @Query('maxLatency') maxLatency?: string,
    @Query('minScore') minScore?: string,
    @Query('ucp') ucp?: string,
    @Query('mcp') mcp?: string,
  ) {
    return this.discovery.discover({
      category,
      maxLatencyMs: maxLatency ? Number(maxLatency) : undefined,
      minScore:     minScore   ? Number(minScore)   : undefined,
      ucpRequired:  ucp === 'true',
      mcpRequired:  mcp === 'true',
    });
  }
}
