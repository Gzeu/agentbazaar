import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { MultiversxService } from '../multiversx/multiversx.service';
import { RegisterServiceDto, UpdateServiceDto, ServiceFilterDto } from './dto/service.dto';

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

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);
  // In-memory store for MVP — replace with Postgres in production
  private readonly services = new Map<string, ServiceRecord>();

  constructor(private readonly mvx: MultiversxService) {}

  async registerService(dto: RegisterServiceDto): Promise<ServiceRecord> {
    const id = uuidv4();
    const record: ServiceRecord = {
      id,
      name: dto.name,
      description: dto.description,
      category: dto.category,
      version: dto.version,
      providerAddress: dto.providerAddress,
      endpoint: dto.endpoint,
      pricingModel: dto.pricingModel,
      priceAmount: dto.priceAmount,
      priceToken: dto.priceToken,
      maxLatencyMs: dto.maxLatencyMs,
      uptimeGuarantee: dto.uptimeGuarantee,
      inputSchema: dto.inputSchema || {},
      outputSchema: dto.outputSchema || {},
      stakeAmount: dto.stakeAmount,
      ucpCompatible: dto.ucpCompatible,
      mcpCompatible: dto.mcpCompatible,
      tags: dto.tags || [],
      reputationScore: 5000,
      active: true,
      registeredAt: new Date().toISOString(),
      totalTasks: 0,
    };

    this.services.set(id, record);
    this.logger.log(`Service registered: ${id} by ${dto.providerAddress}`);

    // TODO: Broadcast register tx to MultiversX Registry contract
    // await this.mvx.broadcastTransaction(...);

    return record;
  }

  async listServices(filters: ServiceFilterDto): Promise<{ data: ServiceRecord[]; total: number }> {
    let results = Array.from(this.services.values()).filter((s) => s.active);

    if (filters.category) {
      results = results.filter((s) => s.category === filters.category);
    }
    if (filters.minReputation) {
      results = results.filter((s) => s.reputationScore >= filters.minReputation * 100);
    }
    if (filters.ucpCompatible !== undefined) {
      results = results.filter((s) => s.ucpCompatible === filters.ucpCompatible);
    }
    if (filters.mcpCompatible !== undefined) {
      results = results.filter((s) => s.mcpCompatible === filters.mcpCompatible);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const start = (page - 1) * limit;

    return {
      data: results.slice(start, start + limit),
      total: results.length,
    };
  }

  async getService(serviceId: string): Promise<ServiceRecord> {
    const record = this.services.get(serviceId);
    if (!record) throw new NotFoundException(`Service ${serviceId} not found`);
    return record;
  }

  async updateService(serviceId: string, dto: UpdateServiceDto): Promise<ServiceRecord> {
    const record = await this.getService(serviceId);
    if (dto.priceAmount) record.priceAmount = dto.priceAmount;
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

  async getQuote(serviceId: string, _payload: string): Promise<{ price: string; estimatedLatencyMs: number }> {
    const record = await this.getService(serviceId);
    return {
      price: record.priceAmount,
      estimatedLatencyMs: record.maxLatencyMs,
    };
  }
}
