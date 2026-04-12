import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MultiversxService } from '../multiversx/multiversx.service';
import { EventsGateway } from './events.gateway';
import { ChainEvent } from './chain-event.types';
import { v4 as uuidv4 } from 'uuid';

const EVENT_IDENTIFIERS: Record<string, string> = {
  serviceRegistered: 'ServiceRegistered',
  taskCreated:       'TaskCreated',
  taskCompleted:     'TaskCompleted',
  taskRefunded:      'TaskRefunded',
  disputeOpened:     'TaskDisputed',
  disputeResolved:   'TaskDisputed',
  scoreUpdated:      'ReputationUpdated',
  agentSlashed:      'ReputationUpdated',
};

@Injectable()
export class EventPoller implements OnModuleDestroy {
  private readonly logger = new Logger(EventPoller.name);
  private lastNonce = 0;
  private running = true;

  constructor(
    private readonly mvx:     MultiversxService,
    private readonly emitter: EventEmitter2,
    private readonly gateway: EventsGateway,
  ) {}

  onModuleDestroy() {
    this.running = false;
  }

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
        await this.fetchContractEvents(address);
      }
      this.lastNonce = currentNonce;
    } catch (err) {
      this.logger.warn(`EventPoller error: ${(err as Error).message}`);
    }
  }

  private async fetchContractEvents(address: string) {
    try {
      const apiUrl = this.mvx.NETWORK === 'mainnet'
        ? 'https://api.multiversx.com'
        : `https://${this.mvx.NETWORK}-api.multiversx.com`;

      const res = await fetch(
        `${apiUrl}/accounts/${address}/transactions?status=success&size=25&order=asc`,
        { headers: { Accept: 'application/json' } },
      );
      if (!res.ok) return;

      const txs: Record<string, unknown>[] = await res.json();
      for (const tx of txs) {
        const func   = String(tx['function'] ?? '');
        const mapped = EVENT_IDENTIFIERS[func] ?? func;
        if (!mapped) continue;

        const event: ChainEvent = {
          id:         String(tx['txHash'] ?? uuidv4()),
          type:       mapped,
          txHash:     tx['txHash'] as string | undefined,
          timestamp:  Number(tx['timestamp'] ?? 0) * 1000,
          blockNonce: Number(tx['round'] ?? 0),
          data: {
            sender:   tx['sender'],
            receiver: tx['receiver'],
            value:    tx['value'] ?? '0',
            function: func,
          },
        };

        this.gateway.broadcastChainEvent(event);
        this.emitter.emit('chain.event', event);
      }
    } catch (err) {
      this.logger.debug(`fetchContractEvents error for ${address}: ${(err as Error).message}`);
    }
  }

  private emitMock() {
    const types = [
      'TaskCreated', 'TaskCompleted', 'ServiceRegistered',
      'ReputationUpdated', 'EscrowReleased',
    ];
    const rnd = (n: number) =>
      Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const event: ChainEvent = {
      id:         rnd(8),
      type:       types[Math.floor(Math.random() * types.length)],
      txHash:     rnd(32),
      timestamp:  Date.now(),
      blockNonce: Math.floor(Math.random() * 9_999_999),
      data:       { mock: 'true', source: 'EventPoller' },
    };
    this.gateway.broadcastChainEvent(event);
    this.emitter.emit('chain.event', event);
  }
}
