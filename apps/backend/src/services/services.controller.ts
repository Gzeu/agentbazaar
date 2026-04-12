import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ServicesService } from './services.service';
import { McpContractService } from '../multiversx/mcp-contract.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(
    private readonly svc: ServicesService,
    private readonly contracts: McpContractService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all services (merged on-chain + in-memory)' })
  findAll(@Query('category') category?: string, @Query('limit') limit = '50') {
    return this.svc.findAll({ category, limit: Number(limit) });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new service (in-memory + optionally on-chain)' })
  async create(@Body() body: Record<string, unknown>) {
    const record = this.svc.create(body);

    // Optionally register on-chain via SC MCP if providerAddress is set
    if (body.registerOnChain === true && body.providerAddress) {
      try {
        const result = await this.contracts.registerService(
          record.name,
          record.endpoint,
          record.priceAmount,
          record.priceToken,
        );
        if (result.success) {
          return { ...record, onChain: true, txHash: result.txHash };
        }
      } catch (err) {
        // Non-fatal: service is registered in-memory even if on-chain fails
      }
    }

    return record;
  }

  @Get(':id/abi')
  @ApiOperation({ summary: 'Fetch ABI for a service contract address via SC MCP' })
  async getAbi(@Param('id') id: string) {
    const service = this.svc.findOne(id);
    if (!service.providerAddress) {
      return { error: 'No providerAddress for this service' };
    }
    return this.contracts['mcp'].getAbi(service.providerAddress);
  }

  @Get(':id/reputation')
  @ApiOperation({ summary: 'Get live on-chain reputation score for a service provider' })
  async getReputation(@Param('id') id: string) {
    const service = this.svc.findOne(id);
    const score = await this.contracts.getReputation(service.providerAddress);
    return {
      serviceId: id,
      providerAddress: service.providerAddress,
      reputationScore: score,
      onChain: score > 0,
      timestamp: new Date().toISOString(),
    };
  }
}
