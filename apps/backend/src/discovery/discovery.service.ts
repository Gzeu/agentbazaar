import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServicesService } from '../services/services.service';
import { McpContractService } from '../multiversx/mcp-contract.service';

interface DiscoveryQuery {
  category?:     string;
  maxLatencyMs?: number;
  minScore?:     number;
  ucpRequired?:  boolean;
  mcpRequired?:  boolean;
}

/** Standard UCP service descriptor returned to external AI agents */
export interface UcpServiceDescriptor {
  id: string;
  name: string;
  category: string;
  description: string;
  endpoint: string;
  paymentProtocol: 'x402';
  paymentToken: 'EGLD';
  priceAmount: string;          // in smallest denomination (10^-18 EGLD)
  escrowContract: string;
  providerAddress: string;
  reputationScore: number;
  totalTasks: number;
  maxLatencyMs: number;
  ucpCompatible: true;
  mcpCompatible: boolean;
  tags: string[];
  network: string;
}

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(
    private readonly services: ServicesService,
    private readonly contracts: McpContractService,
    private readonly config: ConfigService,
  ) {}

  discover(query: DiscoveryQuery) {
    const { data: all } = this.services.findAll({ limit: 1000 });

    const filtered = all.filter(s => {
      if (!s.active)             return false;
      if (query.category     && s.category !== query.category)       return false;
      if (query.maxLatencyMs && s.maxLatencyMs > query.maxLatencyMs) return false;
      if (query.minScore     && s.reputationScore < query.minScore)  return false;
      if (query.ucpRequired  && !s.ucpCompatible)                    return false;
      if (query.mcpRequired  && !s.mcpCompatible)                    return false;
      return true;
    });

    const scored = filtered
      .map(s => ({
        ...s,
        _score: s.reputationScore * 0.7 + (1000 / (s.maxLatencyMs || 1)) * 0.3,
      }))
      .sort((a, b) => b._score - a._score);

    this.logger.debug(`Discovery: ${scored.length} results for query ${JSON.stringify(query)}`);

    return {
      query,
      results: scored,
      count: scored.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * UCP-compliant service catalog.
   * Returns services in a standard format consumable by AI agents
   * that understand the UCP/x402/MCP stack.
   *
   * Merges on-chain data (from contracts via SC MCP) with
   * in-memory registry as fallback.
   */
  async getUcpCatalog(): Promise<{
    protocol: string;
    version: string;
    network: string;
    escrowContract: string;
    services: UcpServiceDescriptor[];
    timestamp: string;
  }> {
    const apiBase  = this.config.get('API_BASE_URL', 'http://localhost:3001');
    const network  = this.config.get('MVX_NETWORK', 'devnet');
    const escrowAddr = this.contracts['mvx'].ESCROW_CONTRACT ?? '';

    // Try to get live on-chain services first
    let onChainServices = await this.contracts.getAllServices();

    // Merge with in-memory seed services (fill in missing on-chain entries)
    const { data: inMemory } = this.services.findAll({ limit: 1000 });

    const allServices: UcpServiceDescriptor[] = [
      ...onChainServices.map(s => ({
        id:              s.id,
        name:            s.name,
        category:        'general',
        description:     `On-chain registered service by ${s.providerAddress.slice(0, 12)}…`,
        endpoint:        s.endpoint || `${apiBase}/tasks`,
        paymentProtocol: 'x402' as const,
        paymentToken:    'EGLD' as const,
        priceAmount:     s.priceAmount,
        escrowContract:  escrowAddr,
        providerAddress: s.providerAddress,
        reputationScore: s.reputationScore,
        totalTasks:      s.totalTasks,
        maxLatencyMs:    500,
        ucpCompatible:   true as const,
        mcpCompatible:   true,
        tags:            ['on-chain'],
        network,
      })),
      ...inMemory
        .filter(s => s.active && s.ucpCompatible)
        .map(s => ({
          id:              s.id,
          name:            s.name,
          category:        s.category,
          description:     s.description,
          endpoint:        s.endpoint,
          paymentProtocol: 'x402' as const,
          paymentToken:    'EGLD' as const,
          priceAmount:     s.priceAmount,
          escrowContract:  escrowAddr,
          providerAddress: s.providerAddress,
          reputationScore: s.reputationScore,
          totalTasks:      s.totalTasks,
          maxLatencyMs:    s.maxLatencyMs,
          ucpCompatible:   true as const,
          mcpCompatible:   s.mcpCompatible,
          tags:            s.tags,
          network,
        })),
    ];

    // Deduplicate by id (on-chain takes priority)
    const seen = new Set<string>();
    const deduped = allServices.filter(s => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });

    return {
      protocol:       'ucp/1.0',
      version:        '1.0',
      network:        `multiversx-${network}`,
      escrowContract: escrowAddr,
      services:       deduped,
      timestamp:      new Date().toISOString(),
    };
  }
}
