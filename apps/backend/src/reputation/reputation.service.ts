import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MultiversxService } from '../multiversx/multiversx.service';

export interface ReputationEntry {
  agentAddress: string;
  compositeScore: number;   // 0-10000 bps
  completionRate: number;   // 0.0-1.0
  totalTasks: number;
  successfulTasks: number;
  disputedTasks: number;
  avgLatencyMs: number;
  lastUpdated: string;
  slashed: boolean;
}

const SEED: ReputationEntry[] = [
  { agentAddress: 'erd1qqqqqqqqqqqqqpgq5l62sgxdlhfyc7r27nsu2x0dkqln8vxtc0nsk8k0e6', compositeScore: 9900, completionRate: 1.00, totalTasks: 3204, successfulTasks: 3204, disputedTasks: 0,  avgLatencyMs: 88,  lastUpdated: new Date().toISOString(), slashed: false },
  { agentAddress: 'erd1def000000000000000000000000000000000000000000000000000000002', compositeScore: 9700, completionRate: 0.99, totalTasks: 412,  successfulTasks: 408,  disputedTasks: 2,  avgLatencyMs: 188, lastUpdated: new Date().toISOString(), slashed: false },
  { agentAddress: 'erd1ghi000000000000000000000000000000000000000000000000000000003', compositeScore: 9200, completionRate: 0.95, totalTasks: 189,  successfulTasks: 179,  disputedTasks: 4,  avgLatencyMs: 420, lastUpdated: new Date().toISOString(), slashed: false },
  { agentAddress: 'erd1jkl000000000000000000000000000000000000000000000000000000004', compositeScore: 8400, completionRate: 0.87, totalTasks: 230,  successfulTasks: 200,  disputedTasks: 10, avgLatencyMs: 512, lastUpdated: new Date().toISOString(), slashed: false },
  { agentAddress: 'erd1mno000000000000000000000000000000000000000000000000000000005', compositeScore: 6100, completionRate: 0.70, totalTasks: 44,   successfulTasks: 31,   disputedTasks: 8,  avgLatencyMs: 890, lastUpdated: new Date().toISOString(), slashed: true  },
];

@Injectable()
export class ReputationService implements OnModuleInit {
  private readonly logger = new Logger(ReputationService.name);
  private cache = new Map<string, ReputationEntry>();

  constructor(private mvx: MultiversxService) {}

  onModuleInit() {
    for (const e of SEED) this.cache.set(e.agentAddress, e);
    this.logger.log(`ReputationService seeded with ${this.cache.size} entries`);
  }

  getLeaderboard(limit: number) {
    const list = Array.from(this.cache.values())
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .slice(0, limit);
    return { leaderboard: list, total: this.cache.size };
  }

  getReputation(address: string): ReputationEntry {
    return this.cache.get(address) ?? {
      agentAddress:   address,
      compositeScore: 0,
      completionRate: 0,
      totalTasks:     0,
      successfulTasks: 0,
      disputedTasks:  0,
      avgLatencyMs:   0,
      lastUpdated:    new Date().toISOString(),
      slashed:        false,
    };
  }

  /** Called automatically when a task completes/fails */
  recordTaskOutcome(providerAddress: string, success: boolean, latencyMs?: number) {
    const entry = this.getReputation(providerAddress);
    const total = entry.totalTasks + 1;
    const successful = entry.successfulTasks + (success ? 1 : 0);
    const completionRate = successful / total;

    // Weighted running average for latency
    const avgLatency = latencyMs != null && success
      ? Math.round((entry.avgLatencyMs * entry.totalTasks + latencyMs) / total)
      : entry.avgLatencyMs;

    // Score: 70% completion rate (max 7000 bps) + 30% latency bonus (max 3000 bps)
    const latencyScore = latencyMs != null && success
      ? Math.max(0, 3000 - Math.floor(latencyMs / 2))
      : Math.max(0, 3000 - Math.floor(entry.avgLatencyMs / 2));
    const compositeScore = Math.round(completionRate * 7000) + latencyScore;

    const updated: ReputationEntry = {
      ...entry,
      totalTasks:     total,
      successfulTasks: successful,
      completionRate,
      avgLatencyMs:   avgLatency,
      compositeScore: Math.min(10000, compositeScore),
      lastUpdated:    new Date().toISOString(),
    };
    this.cache.set(providerAddress, updated);
    this.logger.debug(`Reputation updated: ${providerAddress.slice(0, 10)}… score=${updated.compositeScore}`);
  }

  async syncFromChain(address: string): Promise<void> {
    if (!this.mvx.isConfigured()) return;
    try {
      await this.mvx.queryContract(
        this.mvx.addresses.reputation,
        'getReputation',
        [Buffer.from(address).toString('hex')],
      );
    } catch (err) {
      this.logger.warn(`syncFromChain failed: ${(err as Error).message}`);
    }
  }
}
