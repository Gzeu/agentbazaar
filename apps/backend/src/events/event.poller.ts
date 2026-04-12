import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MultiversxService } from '../multiversx/multiversx.service';
import { McpClientService } from '../multiversx/mcp-client.service';
import { TasksService } from '../tasks/tasks.service';
import { ChainEvent } from './events.gateway';
import { v4 as uuidv4 } from 'uuid';

const EVENT_IDENTIFIERS: Record<string, string> = {
  registerService: 'ServiceRegistered',
  createTask:      'TaskCreated',
  completeTask:    'TaskCompleted',
  refundTask:      'TaskRefunded',
  openDispute:     'TaskDisputed',
  resolveDispute:  'TaskDisputed',
  recordTaskOutcome: 'ReputationUpdated',
};

@Injectable()
export class EventPoller implements OnModuleDestroy {
  private readonly logger = new Logger(EventPoller.name);
  private lastNonce = 0;
  private running = true;

  constructor(
    private readonly mvx:     MultiversxService,
    private readonly mcp:     McpClientService,
    private readonly tasks:   TasksService,
    private readonly emitter: EventEmitter2,
  ) {}

  onModuleDestroy() { this.running = false; }

  @Cron(CronExpression.EVERY_2_SECONDS)
  async poll() {
    if (!this.running) return;

    const contracts = [
      this.mvx.REGISTRY_CONTRACT,
      this.mvx.ESCROW_CONTRACT,
      this.mvx.REPUTATION_CONTRACT,
    ].filter(Boolean);

    if (contracts.length === 0) {
      if (process.env.NODE_ENV !== 'production') this.emitMock();
      return;
    }

    try {
      const provider = this.mvx.getProvider();
      const networkStatus = await provider.getNetworkStatus();
      const currentNonce = networkStatus.HighestFinalNonce;
      if (currentNonce <= this.lastNonce) return;

      for (const address of contracts) {
        await this.fetchContractEvents(address, this.lastNonce, currentNonce);
      }

      this.lastNonce = currentNonce;
    } catch (err) {
      this.logger.warn(`EventPoller error: ${(err as Error).message}`);
    }
  }

  private async fetchContractEvents(
    address: string,
    _fromNonce: number,
    _toNonce: number,
  ) {
    try {
      const network = this.mvx.NETWORK;
      const apiUrl =
        network === 'mainnet'
          ? 'https://api.multiversx.com'
          : `https://${network}-api.multiversx.com`;

      const url = `${apiUrl}/accounts/${address}/transactions?status=success&size=25&order=asc`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) return;

      const txs: Record<string, unknown>[] = await res.json();

      for (const tx of txs) {
        const func   = (tx['function'] as string) || '';
        const mapped = EVENT_IDENTIFIERS[func] || func;
        if (!mapped) continue;

        const event: ChainEvent = {
          id:         (tx['txHash'] as string) || uuidv4(),
          type:       mapped,
          txHash:     tx['txHash'] as string,
          timestamp:  (tx['timestamp'] as number) * 1000,
          blockNonce: (tx['round'] as number) || 0,
          data: {
            sender:   tx['sender'],
            receiver: tx['receiver'],
            value:    tx['value'] || '0',
            function: func,
          },
        };

        // ── Sync task status from on-chain events ──────────
        if (mapped === 'TaskCompleted') {
          await this.handleTaskCompleted(tx);
        }

        this.emitter.emit('chain.event', event);
      }
    } catch (err) {
      this.logger.debug(
        `fetchContractEvents error for ${address}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * When a TaskCompleted event arrives from the escrow contract,
   * decode it via SC MCP and sync the local task store.
   */
  private async handleTaskCompleted(tx: Record<string, unknown>) {
    if (!this.mcp.isConnected) return;

    const txHash = tx['txHash'] as string;
    if (!txHash) return;

    try {
      const decoded = await this.mcp.decodeTx(txHash);
      if (!decoded.success || !decoded.data) return;

      const data = decoded.data as Record<string, unknown>;
      const args = data['args'] as string[] | undefined;
      if (!args || args.length < 2) return;

      const taskId    = Buffer.from(args[0], 'hex').toString('utf8');
      const proofHash = Buffer.from(args[1], 'hex').toString('utf8');
      const latencyMs = parseInt(args[2] ?? '0', 16);

      // Update task in memory with on-chain confirmed data
      try {
        this.tasks.complete(taskId, proofHash, latencyMs || 0);
        this.logger.log(`On-chain sync: task ${taskId} completed (txHash=${txHash})`);
      } catch {
        // Task might not be in local store (e.g. from another backend instance)
      }
    } catch (err) {
      this.logger.debug(`handleTaskCompleted decode error: ${(err as Error).message}`);
    }
  }

  private emitMock() {
    const types = [
      'TaskCreated', 'TaskCompleted', 'ServiceRegistered',
      'ReputationUpdated', 'EscrowReleased',
    ];
    const rnd = (n: number) =>
      Array.from({ length: n }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join('');
    const type = types[Math.floor(Math.random() * types.length)];
    const event: ChainEvent = {
      id:         rnd(8),
      type,
      txHash:     rnd(32),
      timestamp:  Date.now(),
      blockNonce: Math.floor(Math.random() * 9_999_999),
      data:       { mock: 'true', source: 'EventPoller' },
    };
    this.emitter.emit('chain.event', event);
  }
}
