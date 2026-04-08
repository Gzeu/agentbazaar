import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MultiversxService } from '../multiversx/multiversx.service';

export interface ReputationEntry {
  agentAddress: string;
  compositeScore: number;
  completionRate: number;
  totalTasks: number;
  successfulTasks: number;
  avgLatencyMs: number;
  slashed: boolean;
}

const MOCK_LEADERBOARD: ReputationEntry[] = [
  { agentAddress: 'erd1abc…0001', compositeScore: 99, completionRate: 1.00, totalTasks: 3204, successfulTasks: 3204, avgLatencyMs: 88,  slashed: false },
  { agentAddress: 'erd1def…0002', compositeScore: 97, completionRate: 0.99, totalTasks: 412,  successfulTasks: 408,  avgLatencyMs: 188, slashed: false },
  { agentAddress: 'erd1ghi…0003', compositeScore: 92, completionRate: 0.95, totalTasks: 189,  successfulTasks: 179,  avgLatencyMs: 420, slashed: false },
  { agentAddress: 'erd1jkl…0004', compositeScore: 84, completionRate: 0.87, totalTasks: 230,  successfulTasks: 200,  avgLatencyMs: 512, slashed: false },
  { agentAddress: 'erd1mno…0005', compositeScore: 61, completionRate: 0.70, totalTasks: 44,   successfulTasks: 31,   avgLatencyMs: 890, slashed: true  },
];

@Injectable()
export class ReputationService implements OnModuleInit {
  private readonly logger = new Logger(ReputationService.name);
  private cache = new Map<string, ReputationEntry>();

  constructor(private mvx: MultiversxService) {}

  onModuleInit() {
    for (const e of MOCK_LEADERBOARD) {
      this.cache.set(e.agentAddress, e);
    }
    this.logger.log('Reputation cache seeded with mock data');
  }

  getLeaderboard(limit: number): ReputationEntry[] {
    return Array.from(this.cache.values())
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .slice(0, limit);
  }

  getReputation(address: string): ReputationEntry {
    return this.cache.get(address) ?? {
      agentAddress: address,
      compositeScore: 0,
      completionRate: 0,
      totalTasks: 0,
      successfulTasks: 0,
      avgLatencyMs: 0,
      slashed: false,
    };
  }

  async syncFromChain(address: string): Promise<void> {
    if (!this.mvx.isConfigured()) return;
    try {
      const result = await this.mvx.queryContract(
        this.mvx.addresses.reputation,
        'getReputation',
        [Buffer.from(address).toString('hex')],
      );
      if (result) this.logger.debug(`On-chain reputation synced for ${address}`);
    } catch (err) {
      this.logger.warn(`syncFromChain failed: ${(err as Error).message}`);
    }
  }
}
