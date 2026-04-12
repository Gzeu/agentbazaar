import { Controller, Get } from '@nestjs/common';
import { MultiversxService } from '../multiversx/multiversx.service';
import { McpClientService } from '../multiversx/mcp-client.service';
import { TasksService } from '../tasks/tasks.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly mvx: MultiversxService,
    private readonly mcp: McpClientService,
    private readonly tasks: TasksService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Full system health check including SC MCP status' })
  async health() {
    const [network, mcpTools] = await Promise.allSettled([
      this.mvx.getNetworkStatus(),
      this.mcp.isConnected ? this.getMcpToolCount() : Promise.resolve(0),
    ]);

    const metrics = this.tasks.getMetrics();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.2.0',
      network: this.mvx.NETWORK,
      contracts: {
        ...this.mvx.addresses,
        configured: this.mvx.isConfigured(),
      },
      multiversx: {
        reachable: network.status === 'fulfilled' && Boolean(network.value),
        nonce: (network.status === 'fulfilled' && (network.value as any)?.data?.status?.erd_nonce) ?? null,
      },
      mcp: {
        connected:    this.mcp.isConnected,
        toolsLoaded:  mcpTools.status === 'fulfilled' ? mcpTools.value : 0,
        description:  this.mcp.isConnected
          ? 'MultiversX SC MCP — ABI-grounded contract operations active'
          : 'SC MCP not connected — using direct SDK fallback',
      },
      tasks: metrics,
      uptime: process.uptime(),
    };
  }

  private async getMcpToolCount(): Promise<number> {
    try {
      // McpClientService exposes isConnected; tool count is logged at startup
      // We return a static known count from the multiversx-sc-mcp package
      return 22;
    } catch {
      return 0;
    }
  }
}
