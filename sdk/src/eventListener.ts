/**
 * eventListener.ts
 * Polls MultiversX devnet API for SC events emitted by AgentBazaar contracts.
 * Supports: ServiceRegistered, TaskCreated, TaskCompleted, TaskRefunded, DisputeOpened, ReputationUpdated.
 */

import { DevnetConfig } from "./types";

export type AgentBazaarEventType =
  | "ServiceRegistered"
  | "TaskCreated"
  | "TaskCompleted"
  | "TaskRefunded"
  | "DisputeOpened"
  | "ReputationUpdated";

export interface AgentBazaarEvent {
  type: AgentBazaarEventType;
  txHash: string;
  contractAddress: string;
  timestamp: number;
  topics: string[];
  data?: string;
}

export type EventHandler = (event: AgentBazaarEvent) => void | Promise<void>;

interface ApiTransaction {
  txHash: string;
  timestamp: number;
  logs?: {
    events?: Array<{
      identifier: string;
      address: string;
      topics?: string[];
      data?: string;
    }>;
  };
}

export class EventListener {
  private running = false;
  private lastTimestamp = 0;
  private readonly handlers = new Map<AgentBazaarEventType | "*", EventHandler[]>();
  private readonly api: string;
  private readonly watchAddresses: string[];

  constructor(config: DevnetConfig) {
    this.api = config.api ?? config.proxy;
    this.watchAddresses = Object.values(config.addresses).filter(Boolean) as string[];
  }

  on(event: AgentBazaarEventType | "*", handler: EventHandler): this {
    const existing = this.handlers.get(event) ?? [];
    this.handlers.set(event, [...existing, handler]);
    return this;
  }

  start(pollIntervalMs = 500): void {
    if (this.running) return;
    this.running = true;
    this.lastTimestamp = Math.floor(Date.now() / 1000) - 10;
    void this.poll(pollIntervalMs);
  }

  stop(): void {
    this.running = false;
  }

  private async poll(intervalMs: number): Promise<void> {
    while (this.running) {
      try {
        await this.fetchAndDispatch();
      } catch (_) {
        // Network errors are non-fatal in polling loops
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  private async fetchAndDispatch(): Promise<void> {
    for (const address of this.watchAddresses) {
      const url = `${this.api}/accounts/${address}/transactions?after=${this.lastTimestamp}&size=25&order=asc`;
      const res = await fetch(url);
      if (!res.ok) continue;

      const txns = await res.json() as ApiTransaction[];
      for (const tx of txns) {
        this.lastTimestamp = Math.max(this.lastTimestamp, tx.timestamp);
        for (const event of tx.logs?.events ?? []) {
          const knownTypes: AgentBazaarEventType[] = [
            "ServiceRegistered",
            "TaskCreated",
            "TaskCompleted",
            "TaskRefunded",
            "DisputeOpened",
            "ReputationUpdated",
          ];
          if (!knownTypes.includes(event.identifier as AgentBazaarEventType)) continue;

          const parsed: AgentBazaarEvent = {
            type: event.identifier as AgentBazaarEventType,
            txHash: tx.txHash,
            contractAddress: event.address,
            timestamp: tx.timestamp,
            topics: event.topics ?? [],
            data: event.data,
          };

          const typeHandlers = this.handlers.get(parsed.type) ?? [];
          const wildcardHandlers = this.handlers.get("*") ?? [];
          for (const h of [...typeHandlers, ...wildcardHandlers]) {
            await h(parsed);
          }
        }
      }
    }
  }
}
