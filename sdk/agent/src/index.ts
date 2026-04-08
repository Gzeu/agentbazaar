/**
 * AgentBazaar Agent SDK
 * Enables AI agents to discover, buy, and sell services on AgentBazaar.
 * Compatible with MultiversX Supernova. Ready for UCP/ACP/AP2/MCP/x402.
 *
 * Usage (provider agent):
 *   const sdk = new AgentBazaarSDK({ network: 'devnet', privateKey: '...' });
 *   await sdk.registerService({ name: 'MyService', ... });
 *
 * Usage (consumer agent):
 *   const services = await sdk.discoverServices({ category: 'data-fetching' });
 *   const result = await sdk.buyAndExecute(services[0], { symbol: 'EGLD' });
 */

export interface SDKConfig {
  network: 'devnet' | 'mainnet' | 'testnet';
  registryAddress?: string;
  escrowAddress?: string;
  reputationAddress?: string;
  privateKey?: string; // hex, for server-side agent use
  apiUrl?: string;
}

export interface ServiceDescriptor {
  serviceId: string;
  name: string;
  category: string;
  providerAddress: string;
  endpointUrl: string;
  pricingModel: 'per-request' | 'per-token' | 'per-second' | 'per-workflow' | 'per-action' | 'subscription';
  priceAmount: string; // EGLD
  maxLatencyMs: number;
  uptimeGuaranteeBps: number;
  ucpCompatible: boolean;
  mcpCompatible: boolean;
  metadataHash?: string;
}

export interface TaskResult {
  taskId: string;
  status: 'completed' | 'failed' | 'timeout';
  result?: unknown;
  proofHash?: string;
  latencyMs: number;
  txHash?: string;
}

export interface DiscoverOptions {
  category?: string;
  maxPriceEgld?: number;
  maxLatencyMs?: number;
  ucpOnly?: boolean;
  mcpOnly?: boolean;
  limit?: number;
}

// ── Network config ──────────────────────────────────────────────────────────

const DEVNET_CONFIG = {
  apiUrl: 'https://devnet-api.multiversx.com',
  explorerUrl: 'https://devnet-explorer.multiversx.com',
  chainId: 'D',
};

const MAINNET_CONFIG = {
  apiUrl: 'https://api.multiversx.com',
  explorerUrl: 'https://explorer.multiversx.com',
  chainId: '1',
};

// ── Main SDK Class ──────────────────────────────────────────────────────────

export class AgentBazaarSDK {
  private config: Required<SDKConfig>;
  private networkConfig: typeof DEVNET_CONFIG;

  constructor(config: SDKConfig) {
    this.networkConfig = config.network === 'mainnet' ? MAINNET_CONFIG : DEVNET_CONFIG;
    this.config = {
      network: config.network,
      registryAddress: config.registryAddress ?? '',
      escrowAddress: config.escrowAddress ?? '',
      reputationAddress: config.reputationAddress ?? '',
      privateKey: config.privateKey ?? '',
      apiUrl: config.apiUrl ?? this.networkConfig.apiUrl,
    };
  }

  // ── Discovery (UCP) ────────────────────────────────────────────────────────

  /**
   * Discover services from the on-chain registry.
   * Implements UCP-compatible service discovery.
   */
  async discoverServices(opts: DiscoverOptions = {}): Promise<ServiceDescriptor[]> {
    // In production: query Registry contract view functions via mx-sdk-js
    // For now: returns mock data shape. Replace with:
    //   const proxy = new ProxyNetworkProvider(this.config.apiUrl);
    //   const interaction = registry.methods.getAllServices();
    //   const response = await proxy.queryContract(interaction.buildQuery());
    console.log('[AgentBazaar SDK] discoverServices', opts);
    throw new Error('Connect Registry contract address via SDKConfig.registryAddress and implement with @multiversx/sdk-core');
  }

  // ── Quote Request (ACP) ────────────────────────────────────────────────────

  /**
   * Request a price quote from a provider agent.
   * Implements ACP checkout initiation.
   */
  async requestQuote(service: ServiceDescriptor, payload: unknown): Promise<{
    quoteId: string;
    priceEgld: string;
    validUntil: number;
    mandateRequired: boolean;
  }> {
    const response = await fetch(`${service.endpointUrl}/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, buyer: this.config.privateKey ? 'agent' : 'unknown' }),
    });
    if (!response.ok) throw new Error(`Quote request failed: ${response.status}`);
    return response.json();
  }

  // ── AP2 Mandate Verification ───────────────────────────────────────────────

  /**
   * Verify that the current agent has an active AP2 mandate
   * covering this service category and price.
   */
  async verifyMandate(serviceCategory: string, priceEgld: string): Promise<boolean> {
    // In production: query AP2 mandate contract
    // Check: category allowed, budget within mandate limit, provider not blacklisted
    console.log('[AgentBazaar SDK] verifyMandate', { serviceCategory, priceEgld });
    return true; // stub — replace with on-chain mandate check
  }

  // ── Payment (x402) ────────────────────────────────────────────────────────

  /**
   * Execute payment via x402 protocol.
   * Locks funds in Escrow contract.
   * Returns transaction hash.
   */
  async submitTaskWithPayment(
    service: ServiceDescriptor,
    payload: unknown,
    budgetEgld: string,
    deadlineSeconds: number = 60,
  ): Promise<string> {
    // In production:
    //   1. Build escrow.submitTask() transaction with @multiversx/sdk-core
    //   2. Sign with privateKey
    //   3. Broadcast via ProxyNetworkProvider
    //   4. Wait for finality (~300ms on Supernova)
    //   5. Return txHash
    const taskId = 'task-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    console.log('[AgentBazaar SDK] submitTaskWithPayment', { taskId, budgetEgld });
    throw new Error('Implement with @multiversx/sdk-core: build+sign+broadcast escrow.submitTask()');
  }

  // ── Execution (MCP) ───────────────────────────────────────────────────────

  /**
   * Execute a service via MCP-compatible endpoint.
   * Returns result and proof hash.
   */
  async executeService(
    service: ServiceDescriptor,
    taskId: string,
    payload: unknown,
    timeoutMs: number = 5000,
  ): Promise<{ result: unknown; proofHash: string }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${service.endpointUrl}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Task-Id': taskId },
        body: JSON.stringify({ taskId, payload }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Execution failed: ${response.status}`);
      const data = await response.json();
      return { result: data.result, proofHash: data.proofHash ?? '' };
    } finally {
      clearTimeout(timeout);
    }
  }

  // ── Full E2E Flow ─────────────────────────────────────────────────────────

  /**
   * One-call full flow: discover → quote → mandate check → pay → execute → return result.
   * This is the primary entry point for consumer agents.
   */
  async buyAndExecute(
    service: ServiceDescriptor,
    payload: unknown,
    opts: { timeoutMs?: number } = {},
  ): Promise<TaskResult> {
    const start = Date.now();
    try {
      // 1. Quote (ACP)
      const quote = await this.requestQuote(service, payload);

      // 2. Mandate check (AP2)
      const mandateOk = await this.verifyMandate(service.category, quote.priceEgld);
      if (!mandateOk) throw new Error('AP2 mandate check failed');

      // 3. Pay & lock escrow (x402)
      const txHash = await this.submitTaskWithPayment(
        service, payload, quote.priceEgld, 120,
      );
      const taskId = 'task-' + txHash.slice(2, 10);

      // 4. Execute (MCP)
      const { result, proofHash } = await this.executeService(
        service, taskId, payload, opts.timeoutMs ?? 10_000,
      );

      return {
        taskId,
        status: 'completed',
        result,
        proofHash,
        latencyMs: Date.now() - start,
        txHash,
      };
    } catch (err) {
      return {
        taskId: 'task-failed-' + Date.now(),
        status: 'failed',
        latencyMs: Date.now() - start,
      };
    }
  }

  // ── Provider Helpers ───────────────────────────────────────────────────────

  /**
   * Register a service on-chain (provider agent).
   */
  async registerService(descriptor: ServiceDescriptor & { stakeEgld: string }): Promise<string> {
    console.log('[AgentBazaar SDK] registerService', descriptor.serviceId);
    throw new Error('Implement with @multiversx/sdk-core: build+sign+broadcast registry.registerService()');
  }

  /**
   * Submit execution proof on-chain after completing a task (provider agent).
   */
  async submitProof(taskId: string, proofHash: string): Promise<string> {
    console.log('[AgentBazaar SDK] submitProof', { taskId, proofHash });
    throw new Error('Implement with @multiversx/sdk-core: build+sign+broadcast escrow.submitProofAndRelease()');
  }
}

// ── Convenience factory ────────────────────────────────────────────────────

export function createDevnetSDK(config: Omit<SDKConfig, 'network'> = {}): AgentBazaarSDK {
  return new AgentBazaarSDK({ ...config, network: 'devnet' });
}

export function createMainnetSDK(config: Omit<SDKConfig, 'network'> = {}): AgentBazaarSDK {
  return new AgentBazaarSDK({ ...config, network: 'mainnet' });
}

export default AgentBazaarSDK;
