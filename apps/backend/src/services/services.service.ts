import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

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
  updatedAt: string;
}

const SEED: Omit<ServiceRecord, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'DataFetch Pro', category: 'data', description: 'Real-time market data for any token pair. Sub-300ms SLA.',
    providerAddress: 'erd1qqqqqqqqqqqqqpgq5l62sgxdlhfyc7r27nsu2x0dkqln8vxtc0nsk8k0e6',
    endpoint: 'https://mock-agent-1.agentbazaar.io/mcp', pricingModel: 'per-call',
    priceAmount: '1000000000000000', priceToken: 'EGLD',
    maxLatencyMs: 300, uptimeGuarantee: 99, reputationScore: 9700,
    totalTasks: 412, ucpCompatible: true, mcpCompatible: true,
    tags: ['market', 'realtime', 'json'], active: true,
  },
  {
    name: 'ML Compute Node', category: 'compute', description: 'Distributed GPU inference for LLM and embedding tasks.',
    providerAddress: 'erd1def000000000000000000000000000000000000000000000000000000002',
    endpoint: 'https://mock-agent-2.agentbazaar.io/mcp', pricingModel: 'per-call',
    priceAmount: '5000000000000000', priceToken: 'EGLD',
    maxLatencyMs: 800, uptimeGuarantee: 95, reputationScore: 9200,
    totalTasks: 189, ucpCompatible: true, mcpCompatible: true,
    tags: ['gpu', 'llm', 'embeddings'], active: true,
  },
  {
    name: 'EGLD Price Oracle', category: 'data', description: 'Signed EGLD/USDC price feed updated every 30s on-chain.',
    providerAddress: 'erd1qqqqqqqqqqqqqpgq5l62sgxdlhfyc7r27nsu2x0dkqln8vxtc0nsk8k0e6',
    endpoint: 'https://mock-agent-3.agentbazaar.io/mcp', pricingModel: 'per-call',
    priceAmount: '500000000000000', priceToken: 'EGLD',
    maxLatencyMs: 100, uptimeGuarantee: 99, reputationScore: 9900,
    totalTasks: 3204, ucpCompatible: true, mcpCompatible: false,
    tags: ['oracle', 'price', 'signed'], active: true,
  },
  {
    name: 'AML Compliance', category: 'compliance', description: 'KYT/AML screening for wallet addresses.',
    providerAddress: 'erd1jkl000000000000000000000000000000000000000000000000000000004',
    endpoint: 'https://mock-agent-4.agentbazaar.io/mcp', pricingModel: 'per-call',
    priceAmount: '3000000000000000', priceToken: 'EGLD',
    maxLatencyMs: 500, uptimeGuarantee: 98, reputationScore: 9500,
    totalTasks: 77, ucpCompatible: true, mcpCompatible: true,
    tags: ['compliance', 'kyc', 'aml'], active: true,
  },
  {
    name: 'NFT Metadata Resolver', category: 'nft', description: 'Resolves and enriches MultiversX NFT metadata including traits and rarity.',
    providerAddress: 'erd1mno000000000000000000000000000000000000000000000000000000005',
    endpoint: 'https://mock-agent-5.agentbazaar.io/mcp', pricingModel: 'per-call',
    priceAmount: '250000000000000', priceToken: 'EGLD',
    maxLatencyMs: 200, uptimeGuarantee: 97, reputationScore: 8800,
    totalTasks: 560, ucpCompatible: true, mcpCompatible: true,
    tags: ['nft', 'metadata', 'traits'], active: true,
  },
];

@Injectable()
export class ServicesService implements OnModuleInit {
  private readonly logger = new Logger(ServicesService.name);
  private store = new Map<string, ServiceRecord>();

  onModuleInit() {
    const now = new Date().toISOString();
    for (const s of SEED) {
      const id = `svc-${uuidv4().slice(0, 8)}`;
      this.store.set(id, { ...s, id, createdAt: now, updatedAt: now });
    }
    this.logger.log(`ServicesService seeded ${this.store.size} services`);
  }

  findAll(opts: { category?: string; tags?: string[]; search?: string; limit: number }) {
    let list = Array.from(this.store.values());
    if (opts.category) list = list.filter(s => s.category === opts.category);
    if (opts.tags?.length) list = list.filter(s => opts.tags!.every(t => s.tags.includes(t)));
    if (opts.search) {
      const q = opts.search.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q)),
      );
    }
    list = list.sort((a, b) => b.reputationScore - a.reputationScore);
    return { services: list.slice(0, opts.limit), total: list.length };
  }

  findOne(id: string): ServiceRecord {
    const s = this.store.get(id);
    if (!s) throw new NotFoundException(`Service ${id} not found`);
    return s;
  }

  create(body: Record<string, unknown>): ServiceRecord {
    const id = `svc-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();
    const record: ServiceRecord = {
      id,
      name:            String(body.name ?? ''),
      category:        String(body.category ?? 'general'),
      description:     String(body.description ?? ''),
      providerAddress: String(body.providerAddress ?? ''),
      endpoint:        String(body.endpoint ?? ''),
      pricingModel:    String(body.pricingModel ?? 'per-call'),
      priceAmount:     String(body.priceAmount ?? '0'),
      priceToken:      String(body.priceToken ?? 'EGLD'),
      maxLatencyMs:    Number(body.maxLatencyMs ?? 500),
      uptimeGuarantee: Number(body.uptimeGuarantee ?? 99),
      reputationScore: 0,
      totalTasks:      0,
      ucpCompatible:   Boolean(body.ucpCompatible ?? true),
      mcpCompatible:   Boolean(body.mcpCompatible ?? true),
      tags:            Array.isArray(body.tags) ? (body.tags as string[]) : [],
      active:          true,
      createdAt:       now,
      updatedAt:       now,
    };
    this.store.set(id, record);
    this.logger.log(`Service registered: ${id} — ${record.name}`);
    return record;
  }

  deactivate(id: string): ServiceRecord {
    const s = this.findOne(id);
    s.active    = false;
    s.updatedAt = new Date().toISOString();
    this.store.set(id, s);
    this.logger.log(`Service deactivated: ${id}`);
    return s;
  }

  incrementTaskCount(serviceId: string) {
    const s = this.store.get(serviceId);
    if (!s) return;
    s.totalTasks++;
    s.updatedAt = new Date().toISOString();
    this.store.set(serviceId, s);
  }
}
