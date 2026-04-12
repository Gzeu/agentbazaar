import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { McpContractService } from '../multiversx/mcp-contract.service';
import { MultiversxService } from '../multiversx/multiversx.service';
import { ChainEvent } from '../events/events.gateway';

export interface ReputationRecord {
  address: string;
  score: number;
  totalTasks: number;
  successTasks: number;
  avgLatencyMs: number;
  lastUpdated: string;
  onChain: boolean; // true = synced from contract
}

@Injectable()
export class ReputationService implements OnModuleInit {
  private readonly logger = new Logger(ReputationService.name);
  private store = new Map<string, ReputationRecord>();

  constructor(
    private readonly contracts: McpContractService,
    private readonly mvx: MultiversxService,
  ) {}

  onModuleInit() {
    // Seed demo reputation data
    const demos = [
      { address: 'erd1provider001', score: 97, totalTasks: 412, successTasks: 400, avgLatencyMs: 187 },
      { address: 'erd1provider002', score: 92, totalTasks: 189, successTasks: 175, avgLatencyMs: 310 },
      { address: 'erd1provider003', score: 99, totalTasks: 3204, successTasks: 3200, avgLatencyMs: 95 },
    ];
    for (const d of demos) {
      this.store.set(d.address, {
        ...d,
        lastUpdated: new Date().toISOString(),
        onChain: false,
      });
    }
    this.logger.log(`Seeded ${this.store.size} reputation records`);
  }

  /**
   * Get reputation — tries on-chain first via SC MCP, falls back to local store.
   */
  async getScore(address: string): Promise<ReputationRecord> {
    if (this.mvx.REPUTATION_CONTRACT) {
      try {
        const onChainScore = await this.contracts.getReputation(address);
        if (onChainScore > 0) {
          const record: ReputationRecord = {
            address,
            score:        onChainScore,
            totalTasks:   this.store.get(address)?.totalTasks ?? 0,
            successTasks: this.store.get(address)?.successTasks ?? 0,
            avgLatencyMs: this.store.get(address)?.avgLatencyMs ?? 0,
            lastUpdated:  new Date().toISOString(),
            onChain:      true,
          };
          this.store.set(address, record);
          return record;
        }
      } catch (err) {
        this.logger.debug(`On-chain getScore failed: ${(err as Error).message}`);
      }
    }

    // Fallback: local store
    return (
      this.store.get(address) ?? {
        address,
        score:        0,
        totalTasks:   0,
        successTasks: 0,
        avgLatencyMs: 0,
        lastUpdated:  new Date().toISOString(),
        onChain:      false,
      }
    );
  }

  getAll(): ReputationRecord[] {
    return Array.from(this.store.values()).sort((a, b) => b.score - a.score);
  }

  // ── Listen to on-chain ReputationUpdated events ─────────
  @OnEvent('chain.event')
  async onChainEvent(event: ChainEvent) {
    if (event.type !== 'ReputationUpdated') return;

    const address = (event.data as Record<string, unknown>)?.['sender'] as string;
    if (!address) return;

    try {
      const score = await this.contracts.getReputation(address);
      const existing = this.store.get(address);
      this.store.set(address, {
        address,
        score,
        totalTasks:   (existing?.totalTasks ?? 0) + 1,
        successTasks: existing?.successTasks ?? 0,
        avgLatencyMs: existing?.avgLatencyMs ?? 0,
        lastUpdated:  new Date().toISOString(),
        onChain:      true,
      });
      this.logger.log(`Reputation synced for ${address}: ${score}`);
    } catch (err) {
      this.logger.debug(`Reputation sync error: ${(err as Error).message}`);
    }
  }
}
