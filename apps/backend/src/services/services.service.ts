import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { MultiversxService } from '../multiversx/multiversx.service';
import {
  RegisterServiceDto,
  UpdateServiceDto,
  ServiceFilterDto,
} from './dto/service.dto';

export interface ServiceRecord {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  providerAddress: string;
  endpoint: string;
  pricingModel: string;
  priceAmount: string;
  priceToken: string;
  maxLatencyMs: number;
  uptimeGuarantee: number;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  stakeAmount: string;
  ucpCompatible: boolean;
  mcpCompatible: boolean;
  tags: string[];
  reputationScore: number;
  active: boolean;
  registeredAt: string;
  totalTasks: number;
}

const SEED_SERVICES: Omit<ServiceRecord, 'registeredAt' | 'totalTasks'>[] = [
  {
    id: 'svc-001', name: 'DataFetch Pro', description: 'Real-time market data for any token pair. Sub-300ms SLA.',
    category: 'data', version: '1.2.0', providerAddress: 'erd1abc000', endpoint: 'https://data.example.com/mcp',
    pricingModel: 'per-call', priceAmount: '1000000000000000', priceToken: 'EGLD',
    maxLatencyMs: 300, uptimeGuarantee: 99, inputSchema: { pair: 'string' }, outputSchema: { price: 'number' },
    stakeAmount: '50000000000000000', ucpCompatible: true, mcpCompatible: true,
    tags: ['market', 'realtime', 'json'], reputationScore: 97, active: true,
  },
  {
    id: 'svc-002', name: 'ML Compute Node', description: 'Distributed GPU inference for LLM and embedding tasks.',
    category: 'compute', version: '2.0.1', providerAddress: 'erd1def000', endpoint: 'https://gpu.example.com/mcp',
    pricingModel: 'per-token', priceAmount: '5000000000000000', priceToken: 'EGLD',
    maxLatencyMs: 800, uptimeGuarantee: 98, inputSchema: { prompt: 'string', model: 'string' }, outputSchema: { output: 'string' },
    stakeAmount: '100000000000000000', ucpCompatible: true, mcpCompatible: true,
    tags: ['gpu', 'llm', 'embeddings'], reputationScore: 92, active: true,
  },
  {
    id: 'svc-003', name: 'EGLD Price Oracle', description: 'Signed EGLD/USDC price feed updated every 30s on-chain.',
    category: 'data', version: '1.0.5', providerAddress: 'erd1ghi000', endpoint: 'https://oracle.example.com/mcp',
    pricingModel: 'subscription', priceAmount: '500000000000000', priceToken: 'EGLD',
    maxLatencyMs: 100, uptimeGuarantee: 99, inputSchema: {}, outputSchema: { price: 'number', timestamp: 'number', signature: 'string' },
    stakeAmount: '200000000000000000', ucpCompatible: true, mcpCompatible: false,
    tags: ['oracle', 'price', 'signed'], reputationScore: 99, active: true,
  },
  {
    id: 'svc-004', name: 'AML Compliance Check', description: 'KYT/AML screening for wallet addresses and transaction paths.',
    category: 'compliance', version: '3.1.0', providerAddress: 'erd1jkl000', endpoint: 'https://aml.example.com/mcp',
    pricingModel: 'per-call', priceAmount: '3000000000000000', priceToken: 'EGLD',
    maxLatencyMs: 500, uptimeGuarantee: 97, inputSchema: { address: 'string' }, outputSchema: { risk: 'string', score: 'number' },
    stakeAmount: '100000000000000000', ucpCompatible: true, mcpCompatible: true,
    tags: ['compliance', 'kyc', 'aml'], reputationScore: 95, active: true,
  },
];

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);
  private readonly services = new Map<string, ServiceRecord>();

  constructor(private readonly mvx: MultiversxService) {
    // Seed dev data
    SEED_SERVICES.forEach((s) => {
      this.services.set(s.id, {
        ...s,
        registeredAt: new Date(Date.now() - Math.random() * 30 * 86400 * 1000).toISOString(),
        totalTasks: Math.floor(Math.random() * 500),
      });
    });
  }

  async registerService(dto: RegisterServiceDto): Promise<ServiceRecord> {
    const id = uuidv4();
    const record: ServiceRecord = {
      id, ...dto,
      inputSchema: dto.inputSchema ?? {},
      outputSchema: dto.outputSchema ?? {},
      tags: dto.tags ?? [],
      reputationScore: 50,
      active: true,
      registeredAt: new Date().toISOString(),
      totalTasks: 0,
    };
    this.services.set(id, record);
    this.logger.log(`Service registered: ${id} by ${dto.providerAddress}`);
    return record;
  }

  async listServices(
    filters: ServiceFilterDto,
  ): Promise<{ data: ServiceRecord[]; total: number; page: number; limit: number }> {
    let results = [...this.services.values()].filter((s) => s.active);

    if (filters.category)
      results = results.filter((s) => s.category === filters.category);
    if (filters.minReputation !== undefined)
      results = results.filter((s) => s.reputationScore >= filters.minReputation!);
    if (filters.ucpCompatible !== undefined)
      results = results.filter((s) => s.ucpCompatible === filters.ucpCompatible);
    if (filters.mcpCompatible !== undefined)
      results = results.filter((s) => s.mcpCompatible === filters.mcpCompatible);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.includes(q)),
      );
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const start = (page - 1) * limit;

    return { data: results.slice(start, start + limit), total: results.length, page, limit };
  }

  async getService(serviceId: string): Promise<ServiceRecord> {
    const record = this.services.get(serviceId);
    if (!record) throw new NotFoundException(`Service ${serviceId} not found`);
    return record;
  }

  async updateService(serviceId: string, dto: UpdateServiceDto): Promise<ServiceRecord> {
    const record = await this.getService(serviceId);
    if (dto.priceAmount !== undefined) record.priceAmount = dto.priceAmount;
    if (dto.active !== undefined) record.active = dto.active;
    if (dto.inputSchema) record.inputSchema = dto.inputSchema;
    if (dto.outputSchema) record.outputSchema = dto.outputSchema;
    this.services.set(serviceId, record);
    return record;
  }

  async deregisterService(serviceId: string): Promise<{ success: boolean }> {
    const record = await this.getService(serviceId);
    record.active = false;
    this.services.set(serviceId, record);
    return { success: true };
  }

  async getQuote(serviceId: string): Promise<{ price: string; estimatedLatencyMs: number; token: string }> {
    const record = await this.getService(serviceId);
    return {
      price: record.priceAmount,
      estimatedLatencyMs: record.maxLatencyMs,
      token: record.priceToken,
    };
  }
}
