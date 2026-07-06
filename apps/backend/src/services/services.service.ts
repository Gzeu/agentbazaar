import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateServiceDto } from './dto/create-service.dto';

export interface ServiceRecord {
  id: string;
  name: string;
  category: string;
  description: string;
  providerAddress: string;
  endpoint: string;
  pricingModel: string;
  priceAmount: string;
  priceToken: string;
  maxLatencyMs: number;
  uptimeGuarantee: number;
  reputationScore: number;
  totalTasks: number;
  ucpCompatible: boolean;
  mcpCompatible: boolean;
  tags: string[];
  active: boolean;
  createdAt: string;
}

const SEED: Omit<ServiceRecord, 'id' | 'createdAt'>[] = [
  {
    name: 'DataFetch Pro', category: 'data',
    description: 'Real-time market data for any token pair. Sub-300ms SLA.',
    providerAddress: 'erd1qqqqqqqqqqqqqpgq0000000000000000000000000000000000000001',
    endpoint: 'https://mock-agent-1.agentbazaar.io/mcp',
    pricingModel: 'per-call', priceAmount: '1000000000000000', priceToken: 'EGLD',
    maxLatencyMs: 300, uptimeGuarantee: 99, reputationScore: 97, totalTasks: 412,
    ucpCompatible: true, mcpCompatible: true, tags: ['market', 'realtime', 'json'], active: true,
  },
  {
    name: 'ML Compute Node', category: 'compute',
    description: 'Distributed GPU inference for LLM and embedding tasks.',
    providerAddress: 'erd1qqqqqqqqqqqqqpgq0000000000000000000000000000000000000002',
    endpoint: 'https://mock-agent-2.agentbazaar.io/mcp',
    pricingModel: 'per-call', priceAmount: '5000000000000000', priceToken: 'EGLD',
    maxLatencyMs: 800, uptimeGuarantee: 95, reputationScore: 92, totalTasks: 189,
    ucpCompatible: true, mcpCompatible: true, tags: ['gpu', 'llm', 'embeddings'], active: true,
  },
  {
    name: 'EGLD Price Oracle', category: 'data',
    description: 'Signed EGLD/USDC price feed updated every 30s on-chain.',
    providerAddress: 'erd1qqqqqqqqqqqqqpgq0000000000000000000000000000000000000003',
    endpoint: 'https://mock-agent-3.agentbazaar.io/mcp',
    pricingModel: 'per-call', priceAmount: '500000000000000', priceToken: 'EGLD',
    maxLatencyMs: 100, uptimeGuarantee: 99, reputationScore: 99, totalTasks: 3204,
    ucpCompatible: true, mcpCompatible: false, tags: ['oracle', 'price', 'signed'], active: true,
  },
  {
    name: 'AML Compliance', category: 'compliance',
    description: 'KYT/AML screening for wallet addresses.',
    providerAddress: 'erd1qqqqqqqqqqqqqpgq0000000000000000000000000000000000000004',
    endpoint: 'https://mock-agent-4.agentbazaar.io/mcp',
    pricingModel: 'per-call', priceAmount: '3000000000000000', priceToken: 'EGLD',
    maxLatencyMs: 500, uptimeGuarantee: 98, reputationScore: 95, totalTasks: 77,
    ucpCompatible: true, mcpCompatible: true, tags: ['compliance', 'kyc', 'aml'], active: true,
  },
];

@Injectable()
export class ServicesService implements OnModuleInit {
  private readonly logger = new Logger(ServicesService.name);
  private store = new Map<string, ServiceRecord>();

  onModuleInit() {
    for (const s of SEED) {
      const id = `svc-${uuidv4().slice(0, 8)}`;
      this.store.set(id, { ...s, id, createdAt: new Date().toISOString() });
    }
    this.logger.log(`Seeded ${this.store.size} mock services`);
  }

  findAll(opts: { category?: string; limit: number; activeOnly?: boolean }) {
    let list = Array.from(this.store.values());
    if (opts.activeOnly) list = list.filter(s => s.active);
    if (opts.category)   list = list.filter(s => s.category === opts.category);
    return { data: list.slice(0, opts.limit), total: list.length };
  }

  findOne(id: string) {
    const s = this.store.get(id);
    if (!s) throw new NotFoundException(`Service ${id} not found`);
    return s;
  }

  create(dto: CreateServiceDto): ServiceRecord {
    const id = `svc-${uuidv4().slice(0, 8)}`;
    const record: ServiceRecord = {
      id,
      name:            dto.name,
      category:        dto.category,
      description:     dto.description ?? '',
      providerAddress: dto.providerAddress,
      endpoint:        dto.endpoint,
      pricingModel:    dto.pricingModel ?? 'per-call',
      priceAmount:     dto.priceAmount,
      priceToken:      'EGLD',
      maxLatencyMs:    dto.maxLatencyMs ?? 500,
      uptimeGuarantee: dto.uptimeGuarantee ?? 99,
      reputationScore: 50,
      totalTasks:      0,
      ucpCompatible:   dto.ucpCompatible ?? true,
      mcpCompatible:   dto.mcpCompatible ?? true,
      tags:            dto.tags ?? [],
      active:          true,
      createdAt:       new Date().toISOString(),
    };
    this.store.set(id, record);
    this.logger.log(`Service registered: ${id} — ${record.name}`);
    return record;
  }

  /** Called after task completion to update reputationScore + totalTasks */
  incrementTaskStats(serviceId: string, success: boolean, latencyMs?: number) {
    const s = this.store.get(serviceId);
    if (!s) return;
    s.totalTasks += 1;
    if (success && latencyMs !== undefined) {
      // Running average reputation score blend (simple EMA)
      const newSample = latencyMs < 300 ? 100 : latencyMs < 600 ? 80 : 60;
      s.reputationScore = Math.round(s.reputationScore * 0.9 + newSample * 0.1);
    }
    s.active = true;
    this.store.set(serviceId, s);
  }
}
