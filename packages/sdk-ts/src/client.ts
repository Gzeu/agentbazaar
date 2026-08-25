import type { ServiceDescriptor } from './types';
import { RegistryClient } from './registry';
import { DiscoveryClient } from './discovery';
import { PaymentClient } from './payment';
import { ExecutionClient } from './execution';
import { ReputationClient } from './reputation';

/** Network configuration for the AgentBazaar SDK. */
export interface AgentBazaarNetworkConfig {
  apiUrl: string;
  chainId: string;
}

/** On-chain contract addresses (devnet/mainnet deployments). */
export interface AgentBazaarContractsConfig {
  registry?: string;
  escrow?: string;
  reputation?: string;
}

/** Full AgentBazaar SDK configuration. */
export interface AgentBazaarConfig {
  network: AgentBazaarNetworkConfig;
  contracts: AgentBazaarContractsConfig;
  /** Optional orchestration API base URL. Defaults to devnet API host assumption. */
  orchestrationUrl?: string;
}

/**
 * UCP (Universal Commerce Protocol) client — service discovery & catalog.
 * Reads the marketplace catalog from the orchestration backend.
 */
export class UcpClient {
  constructor(private readonly baseUrl: string) {}

  /** Fetch the full service catalog registered in the marketplace. */
  async getAllServices(): Promise<ServiceDescriptor[]> {
    const res = await fetch(`${this.baseUrl}/api/v1/services`);
    if (!res.ok) throw new Error(`UCP getAllServices failed: ${res.status}`);
    const body = (await res.json()) as { services?: ServiceDescriptor[] } | ServiceDescriptor[];
    const list = Array.isArray(body) ? body : (body.services ?? []);
    return list;
  }

  /** Fetch a single service by ID. */
  async getService(serviceId: string): Promise<ServiceDescriptor | null> {
    const res = await fetch(`${this.baseUrl}/api/v1/services/${encodeURIComponent(serviceId)}`);
    if (!res.ok) return null;
    return (await res.json()) as ServiceDescriptor;
  }
}

/**
 * Events client — subscribes to marketplace chain events.
 * Polls the orchestration API's event feed and fans out to typed listeners.
 */
export class EventsClient {
  private listeners = new Map<string, Set<(event: unknown) => void>>();
  private timer?: ReturnType<typeof setInterval>;
  private lastSeenIds = new Set<string>();

  constructor(private readonly baseUrl: string) {}

  /** Subscribe to events of a given type. Returns an unsubscribe function. */
  on(type: string, callback: (event: unknown) => void): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(callback);
    return () => this.listeners.get(type)?.delete(callback);
  }

  /** Start polling for events at the given interval (ms). */
  start(intervalMs = 5000): void {
    if (this.timer) return;
    const poll = async () => {
      try {
        const res = await fetch(`${this.baseUrl}/api/v1/events?limit=25`);
        if (!res.ok) return;
        const body = (await res.json()) as { data?: Array<Record<string, unknown>> };
        const list = body.data ?? [];
        // oldest-first so newest end up on top after prepend
        for (const evt of list.reverse()) {
          const id = String(evt['id'] ?? '');
          if (!id || this.lastSeenIds.has(id)) continue;
          this.lastSeenIds.add(id);
          const type = String(evt['type'] ?? '');
          for (const cb of this.listeners.get(type) ?? []) cb(evt);
        }
        if (this.lastSeenIds.size > 1000) this.lastSeenIds.clear();
      } catch {
        // network hiccup — keep polling silently
      }
    };
    void poll();
    this.timer = setInterval(poll, Math.max(intervalMs, 500));
  }

  /** Stop polling. Listeners stay registered. */
  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }
}

/**
 * AgentBazaar — main SDK facade.
 * Composes all protocol clients behind one entry point:
 * - `ucp`         — service discovery / catalog (UCP)
 * - `registry`    — on-chain service registration
 * - `payment`     — escrow / x402 payments
 * - `execution`   — task submission & lifecycle
 * - `reputation`  — on-chain agent reputation
 *
 * Usage:
 * ```ts
 * const ab = new AgentBazaar({ network: { apiUrl, chainId }, contracts });
 * const catalog = await ab.ucp.getAllServices();
 * ```
 */
export class AgentBazaar {
  readonly ucp: UcpClient;
  readonly events: EventsClient;
  readonly registry: RegistryClient;
  readonly payment: PaymentClient;
  readonly execution: ExecutionClient;
  readonly reputation: ReputationClient;

  constructor(config: AgentBazaarConfig) {
    const api = config.network.apiUrl.replace(/\/$/, '');
    const orchestration = (config.orchestrationUrl ?? api).replace(/\/$/, '');
    const { registry, escrow, reputation } = config.contracts;

    this.ucp        = new UcpClient(orchestration);
    this.events     = new EventsClient(orchestration);
    this.registry   = new RegistryClient(registry ?? '', api);
    this.payment    = new PaymentClient(escrow ?? '', api);
    this.execution  = new ExecutionClient(orchestration);
    this.reputation = new ReputationClient(reputation ?? '', api);
  }
}
