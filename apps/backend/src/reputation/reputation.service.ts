import { Injectable, Logger } from '@nestjs/common';
import { MultiversxService } from '../multiversx/multiversx.service';

export interface ReputationRecord {
  agentAddress: string;
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  disputedTasks: number;
  avgLatencyMs: number;
  compositeScore: number; // 0-100
  completionRate: number; // 0.0 - 1.0
  lastUpdated: string;
  slashed: boolean;
  onChain: boolean;
}

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);
  private readonly cache = new Map<string, ReputationRecord>();

  constructor(private readonly mvx: MultiversxService) {}

  async getReputation(address: string): Promise<ReputationRecord> {
    // Try on-chain read first
    if (this.mvx.REPUTATION_CONTRACT) {
      try {
        const raw = await this.mvx.queryView(
          this.mvx.REPUTATION_CONTRACT,
          'getReputation',
          [Buffer.from(address).toString('hex')],
        );
        if (raw && raw.length > 0) {
          // ABI decode is simplified — full impl requires ABI registry
          const cached = this.cache.get(address);
          if (cached) {
            cached.onChain = true;
            return cached;
          }
        }
      } catch (err) {
        this.logger.debug(`getReputation on-chain failed for ${address}: ${err.message}`);
      }
    }

    // Fallback: return from local cache or default
    return (
      this.cache.get(address) ?? {
        agentAddress: address,
        totalTasks: 0,
        successfulTasks: 0,
        failedTasks: 0,
        disputedTasks: 0,
        avgLatencyMs: 0,
        compositeScore: 50,
        completionRate: 0,
        lastUpdated: new Date().toISOString(),
        slashed: false,
        onChain: false,
      }
    );
  }

  async getLeaderboard(limit = 50): Promise<ReputationRecord[]> {
    return [...this.cache.values()]
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .slice(0, limit);
  }

  async recordOutcome(
    address: string,
    success: boolean,
    latencyMs: number,
  ): Promise<ReputationRecord> {
    const rep = await this.getReputation(address);

    rep.totalTasks += 1;
    if (success) rep.successfulTasks += 1;
    else rep.failedTasks += 1;

    // Running average latency
    if (success && latencyMs > 0) {
      rep.avgLatencyMs =
        (rep.avgLatencyMs * (rep.successfulTasks - 1) + latencyMs) / rep.successfulTasks;
    }

    rep.completionRate =
      rep.totalTasks > 0 ? rep.successfulTasks / rep.totalTasks : 0;

    // Score formula:
    // 70% completion rate + 20% latency score + -10% dispute penalty, scaled 0-100
    const completionPts = rep.completionRate * 70;
    const latencyPts =
      rep.avgLatencyMs <= 300
        ? 20
        : rep.avgLatencyMs <= 1000
        ? 15
        : rep.avgLatencyMs <= 3000
        ? 8
        : 0;
    const disputePenalty = rep.totalTasks > 0
      ? (rep.disputedTasks / rep.totalTasks) * 30
      : 0;

    const raw = completionPts + latencyPts - disputePenalty + 10; // +10 base
    rep.compositeScore = Math.min(100, Math.max(0, Math.round(raw)));
    rep.lastUpdated = new Date().toISOString();

    this.cache.set(address, rep);
    return rep;
  }

  async recordDispute(address: string): Promise<ReputationRecord> {
    const rep = await this.getReputation(address);
    rep.disputedTasks += 1;
    await this.recordOutcome(address, false, 0);
    return rep;
  }
}
