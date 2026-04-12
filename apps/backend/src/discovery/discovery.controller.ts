import { Controller, Get, Query } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('discovery')
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discovery: DiscoveryService) {}

  @Get()
  @ApiOperation({ summary: 'Discover services matching constraints (UCP-compatible)' })
  @ApiQuery({ name: 'category',   required: false, description: 'Service category' })
  @ApiQuery({ name: 'tags',       required: false, description: 'Comma-separated tags' })
  @ApiQuery({ name: 'maxLatency', required: false, description: 'Max acceptable latency (ms)' })
  @ApiQuery({ name: 'minScore',   required: false, description: 'Min reputation score (0-10000 bps)' })
  @ApiQuery({ name: 'ucp',        required: false, description: 'Require UCP compatibility' })
  @ApiQuery({ name: 'mcp',        required: false, description: 'Require MCP compatibility' })
  @ApiQuery({ name: 'limit',      required: false, description: 'Max results (default 50, max 100)' })
  discover(
    @Query('category')   category?: string,
    @Query('tags')       tags?: string,
    @Query('maxLatency') maxLatency?: string,
    @Query('minScore')   minScore?: string,
    @Query('ucp')        ucp?: string,
    @Query('mcp')        mcp?: string,
    @Query('limit')      limit?: string,
  ) {
    return this.discovery.discover({
      category,
      tags:         tags ? tags.split(',').map(t => t.trim()) : undefined,
      maxLatencyMs: maxLatency ? Number(maxLatency) : undefined,
      minScore:     minScore   ? Number(minScore)   : undefined,
      ucpRequired:  ucp === 'true',
      mcpRequired:  mcp === 'true',
      limit:        limit ? Number(limit) : undefined,
    });
  }
}
