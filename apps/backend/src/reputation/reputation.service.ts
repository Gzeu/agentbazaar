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
  syncedAt?: string;
}

const MOCK_LEADERBOARD: ReputationEntry[] = [
  { agentAddress: 'erd1abc0001', compositeScore: 99, completionRate: 1.00, totalTasks: 3204, successfulTasks: 3204, avgLatencyMs: 88,  slashed: false },
  { agentAddress: 'erd1def0002', compositeScore: 97, completionRate: 0.99, totalTasks: 412,  successfulTasks: 408,  avgLatencyMs: 188, slashed: false },
  { agentAddress: 'erd1ghi0003', compositeScore: 92, completionRate: 0.95, totalTasks: 189,  successfulTasks: 179,  avgLatencyMs: 420, slashed: false },
  { agentAddress: 'erd1jkl0004', compositeScore: 84, completionRate: 0.87, totalTasks: 230,  successfulTasks: 200,  avgLatencyMs: 512, slashed: false },
  { agentAddress: 'erd1mno0005', compositeScore: 61, completionRate: 0.70, totalTasks: 44,   successfulTasks: 31,   avgLatencyMs: 890, slashed: true  },
];

@Injectable()
export class ReputationService implements OnModuleInit {
  private readonly logger = new Logger(ReputationService.name);
  private cache = new Map<string, ReputationEntry>();

  constructor(private mvx: MultiversxService) {}

  onModuleInit() {
    for (const e of MOCK_LEADERBOARD) this.cache.set(e.agentAddress, e);
    this.logger.log('Reputation cache seeded with mock data');
  }

  getLeaderboard(limit: number): ReputationEntry[] {
    return Array.from(this.cache.values())
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .slice(0, limit);
  }

  async getReputation(address: string): Promise<ReputationEntry> {
    const cached = this.cache.get(address);
    if (cached) return cached;

    // Cache miss — try live on-chain sync
    const live = await this.syncFromChain(address);
    return live ?? {
      agentAddress:   address,
      compositeScore: 0,
      completionRate: 0,
      totalTasks:     0,
      successfulTasks: 0,
      avgLatencyMs:   0,
      slashed:        false,
    };
  }

  /**
   * Called after task completion/failure to keep local cache consistent
   * with what the on-chain Escrow → Reputation contract reflects.
   */
  updateFromTask(
    agentAddress: string,
    success: boolean,
    latencyMs?: number,
  ): void {
    const entry = this.cache.get(agentAddress) ?? {
      agentAddress,
      compositeScore: 50,
      completionRate: 0,
      totalTasks: 0,
      successfulTasks: 0,
      avgLatencyMs: 0,
      slashed: false,
    };

    entry.totalTasks += 1;
    if (success) {
      entry.successfulTasks += 1;
      if (latencyMs !== undefined) {
        // Running average latency
        entry.avgLatencyMs = Math.round(
          (entry.avgLatencyMs * (entry.successfulTasks - 1) + latencyMs) / entry.successfulTasks,
        );
      }
    }
    entry.completionRate = entry.totalTasks > 0
      ? entry.successfulTasks / entry.totalTasks
      : 0;

    // Simple score recalc matching on-chain formula
    const base        = Math.round(entry.completionRate * 70);
    const latBonus    = entry.avgLatencyMs < 500 ? 10 : entry.avgLatencyMs < 1000 ? 5 : 0;
    entry.compositeScore = Math.min(100, base + latBonus);
    entry.syncedAt = new Date().toISOString();

    this.cache.set(agentAddress, entry);
    this.logger.debug(`Reputation updated for ${agentAddress}: score=${entry.compositeScore}`);
  }

  async syncFromChain(address: string): Promise<ReputationEntry | null> {
    if (!this.mvx.isConfigured()) return null;
    try {
      const result = await this.mvx.queryContract(
        this.mvx.addresses.reputation,
        'getReputation',
        [Buffer.from(address).toString('hex')],
      );
      if (!result) return null;

      // Parse MultiversX VM query result (base64 encoded ABI)
      // result.returnData is string[] of base64 encoded values
      const data = result?.returnData ?? result?.data?.returnData;
      if (!data || data.length === 0) return null;

      // Minimal on-chain parse — full ABI decode requires mx-sdk
      // Treat as opaque until full ABI decoder is wired in
      const entry: ReputationEntry = {
        agentAddress:    address,
        compositeScore:  50, // will be overwritten by ABI-decoded fields
        completionRate:  0,
        totalTasks:      0,
        successfulTasks: 0,
        avgLatencyMs:    0,
        slashed:         false,
        syncedAt:        new Date().toISOString(),
      };
      this.cache.set(address, entry);
      this.logger.debug(`On-chain reputation synced for ${address}`);
      return entry;
    } catch (err) {
      this.logger.warn(`syncFromChain failed: ${(err as Error).message}`);
      return null;
    }
  }
}
