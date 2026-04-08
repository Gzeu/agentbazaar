import { Injectable, NotFoundException } from '@nestjs/common';

export interface ReputationRecord {
  agentAddress: string;
  totalTasks: number;
  successfulTasks: number;
  disputedTasks: number;
  avgLatencyMs: number;
  compositeScore: number; // 0-10000 bps
  completionRate: number; // 0-1
  lastUpdated: string;
  slashed: boolean;
}

@Injectable()
export class ReputationService {
  private readonly reputations = new Map<string, ReputationRecord>();

  async getReputation(address: string): Promise<ReputationRecord> {
    const rep = this.reputations.get(address);
    if (!rep) {
      // Return default for new agents
      return {
        agentAddress: address,
        totalTasks: 0,
        successfulTasks: 0,
        disputedTasks: 0,
        avgLatencyMs: 0,
        compositeScore: 5000,
        completionRate: 0,
        lastUpdated: new Date().toISOString(),
        slashed: false,
      };
    }
    return rep;
  }

  async getHistory(address: string): Promise<any[]> {
    // TODO: query from indexer/db
    return [];
  }

  async recordOutcome(
    address: string,
    success: boolean,
    latencyMs: number,
  ): Promise<ReputationRecord> {
    let rep = await this.getReputation(address);

    rep.totalTasks++;
    if (success) rep.successfulTasks++;

    const totalLatency = rep.avgLatencyMs * (rep.totalTasks - 1) + latencyMs;
    rep.avgLatencyMs = totalLatency / rep.totalTasks;
    rep.completionRate = rep.successfulTasks / rep.totalTasks;

    // Composite score: weighted formula with temporal decay
    const completionBps = rep.completionRate * 10000;
    const latencyScore =
      latencyMs <= 2000 ? 10000 : Math.max(0, 10000 - ((latencyMs - 2000) * 10000) / 8000);
    const disputePenalty = (rep.disputedTasks / rep.totalTasks) * 1500;
    const rawScore = (completionBps * 0.4 + latencyScore * 0.2 + 2500) - disputePenalty;

    // Decay: 95% old + 5% new
    rep.compositeScore = Math.min(
      10000,
      Math.round(rep.compositeScore * 0.95 + rawScore * 0.05),
    );
    rep.lastUpdated = new Date().toISOString();

    this.reputations.set(address, rep);
    return rep;
  }
}
