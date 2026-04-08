import {
  Address,
  ApiNetworkProvider,
} from "@multiversx/sdk-core";

// ── Types ──────────────────────────────────────────────────────────────────

export type ServiceCategory =
  | "data-fetching"
  | "compute"
  | "action"
  | "workflow"
  | "inference"
  | "compliance"
  | "enrichment"
  | "orchestration";

export type TaskStatus = "pending" | "executing" | "completed" | "failed" | "disputed";

export interface ServiceDescriptor {
  serviceId: string;
  name: string;
  category: ServiceCategory;
  description: string;
  pricePerCall: string; // in EGLD smallest denomination (10^18)
  endpoint: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  maxLatencyMs: number;
  metadataHash: string; // IPFS/Arweave CID
  provider?: string; // bech32 address
  active?: boolean;
}

export interface Task {
  taskId: string;
  serviceId: string;
  consumer: string;
  provider: string;
  status: TaskStatus;
  inputHash: string;
  resultHash?: string;
  pricePaid: string;
  createdAt: number;
  completedAt?: number;
  latencyMs?: number;
  escrowTx: string;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  resultHash: string;
  latencyMs: number;
  payload?: unknown;
}

export interface QuoteResponse {
  quoteId: string;
  price: string;
  estimatedLatencyMs: number;
  validUntil: number;
}

export interface MandateConfig {
  consumer: string;
  maxSpendPerTask: string;
  maxSpendTotal: string;
  allowedCategories: ServiceCategory[];
  expiresAt: number;
}

export interface ReputationScore {
  agent: string;
  score: number; // 0-100
  totalTasks: number;
  successRate: number;
  avgLatencyMs: number;
  disputes: number;
  stakeEgld: string;
  lastUpdated: number;
}

export interface AgentBazaarConfig {
  networkUrl: string;
  registryAddress: string;
  escrowAddress: string;
  reputationAddress: string;
  chainId: string;
}

// ── AgentBazaar SDK ────────────────────────────────────────────────────────

export class AgentBazaarSDK {
  private provider: ApiNetworkProvider;
  private config: AgentBazaarConfig;

  constructor(config: AgentBazaarConfig) {
    this.config = config;
    this.provider = new ApiNetworkProvider(config.networkUrl);
  }

  // ── Provider: Register a service ──────────────────────────────────────────
  async registerService(
    signerAddress: string,
    descriptor: ServiceDescriptor
  ): Promise<string> {
    const args = [
      descriptor.serviceId,
      descriptor.name,
      descriptor.category,
      descriptor.pricePerCall,
      descriptor.endpoint,
      descriptor.metadataHash,
    ]
      .map((a) => Buffer.from(String(a)).toString("hex"))
      .join("@");
    const nonce = await this.provider
      .getAccount(Address.fromBech32(signerAddress))
      .then((a) => a.nonce);
    const tx = {
      nonce,
      receiver: this.config.registryAddress,
      gasLimit: 15_000_000,
      data: `registerService@${args}`,
      chainID: this.config.chainId,
      version: 1,
    };
    // NOTE: caller must sign & broadcast; here we return the unsigned tx data
    console.log(`[AgentBazaar] registerService tx ready for ${signerAddress}`);
    return JSON.stringify(tx);
  }

  // ── Consumer: Discover services ───────────────────────────────────────────
  async discoverServices(category?: ServiceCategory): Promise<ServiceDescriptor[]> {
    const body = {
      scAddress: this.config.registryAddress,
      funcName: category ? "getServicesByCategory" : "getAllServices",
      args: category ? [Buffer.from(category).toString("hex")] : [],
    };
    try {
      const resp = await fetch(`${this.config.networkUrl}/vm-values/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      return this.decodeServices(data);
    } catch (e) {
      console.error("[AgentBazaar] discoverServices error:", e);
      return [];
    }
  }

  // ── Consumer: Request a quote ─────────────────────────────────────────────
  async requestQuote(
    serviceId: string,
    _inputPayload: Record<string, unknown>
  ): Promise<QuoteResponse> {
    const service = await this.getService(serviceId);
    return {
      quoteId: `quote-${serviceId}-${Date.now()}`,
      price: service?.pricePerCall ?? "0",
      estimatedLatencyMs: service?.maxLatencyMs ?? 1000,
      validUntil: Date.now() + 30_000,
    };
  }

  // ── Consumer: Validate AP2 mandate ───────────────────────────────────────
  async validateMandate(
    mandate: MandateConfig,
    serviceId: string,
    price: string
  ): Promise<{ valid: boolean; reason?: string }> {
    if (Date.now() > mandate.expiresAt) {
      return { valid: false, reason: "Mandate expired" };
    }
    if (BigInt(price) > BigInt(mandate.maxSpendPerTask)) {
      return { valid: false, reason: "Price exceeds maxSpendPerTask mandate" };
    }
    const service = await this.getService(serviceId);
    if (service && !mandate.allowedCategories.includes(service.category)) {
      return { valid: false, reason: `Category ${service.category} not in mandate` };
    }
    return { valid: true };
  }

  // ── Consumer: Execute a task (buy + execute + report) ─────────────────────
  async executeTask(
    consumerAddress: string,
    serviceId: string,
    inputPayload: Record<string, unknown>,
    priceEgld: string,
    mandate?: MandateConfig
  ): Promise<TaskResult> {
    const start = Date.now();

    // AP2 mandate check
    if (mandate) {
      const { valid, reason } = await this.validateMandate(mandate, serviceId, priceEgld);
      if (!valid) throw new Error(`AP2 mandate rejected: ${reason}`);
    }

    const service = await this.getService(serviceId);
    if (!service) throw new Error(`Service not found: ${serviceId}`);

    const taskId = `task-${serviceId}-${Date.now()}`;

    // 1. Build escrow createTask tx (caller must sign externally)
    const inputHash = await this.hashObject(inputPayload);
    const escrowArgs = [serviceId, service.provider ?? "", inputHash]
      .map((a) => Buffer.from(a).toString("hex"))
      .join("@");
    const escrowTxData = `createTask@${escrowArgs}`;
    console.log(`[AgentBazaar] Escrow tx: ${escrowTxData}`);

    // 2. Execute service via MCP-compatible endpoint
    const result = await this.callMCPEndpoint(service.endpoint, inputPayload, taskId);
    const resultHash = await this.hashObject(result);

    // 3. Build releaseTask tx
    const releaseArgs = [
      Buffer.from(taskId).toString("hex"),
      Buffer.from(resultHash).toString("hex"),
    ].join("@");
    console.log(`[AgentBazaar] Release tx: releaseTask@${releaseArgs}`);

    const latencyMs = Date.now() - start;

    // 4. Build recordSuccess tx
    const repArgs = [
      Buffer.from(consumerAddress).toString("hex"),
      latencyMs.toString(16).padStart(16, "0"),
    ].join("@");
    console.log(`[AgentBazaar] Reputation tx: recordSuccess@${repArgs}`);

    return { taskId, success: true, resultHash, latencyMs, payload: result };
  }

  // ── Provider: Register MCP handler ───────────────────────────────────────
  createMCPHandler(
    descriptor: ServiceDescriptor,
    handler: (input: Record<string, unknown>, taskId: string) => Promise<unknown>
  ): { path: string; descriptor: ServiceDescriptor; handle: typeof handler } {
    return {
      path: `/mcp/${descriptor.serviceId}`,
      descriptor,
      handle: handler,
    };
  }

  // ── Reputation: Get agent score ───────────────────────────────────────────
  async getReputation(agentAddress: string): Promise<ReputationScore> {
    try {
      const resp = await fetch(`${this.config.networkUrl}/vm-values/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scAddress: this.config.reputationAddress,
          funcName: "getReputation",
          args: [Address.fromBech32(agentAddress).hex()],
        }),
      });
      const data = await resp.json();
      return this.decodeReputation(agentAddress, data);
    } catch {
      return {
        agent: agentAddress,
        score: 50,
        totalTasks: 0,
        successRate: 0,
        avgLatencyMs: 0,
        disputes: 0,
        stakeEgld: "0",
        lastUpdated: 0,
      };
    }
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private async callMCPEndpoint(
    endpoint: string,
    input: Record<string, unknown>,
    taskId: string
  ): Promise<unknown> {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Task-Id": taskId,
        "X-Agent-Bazaar-Version": "1",
        "X-Protocol": "MCP",
      },
      body: JSON.stringify({ taskId, input }),
    });
    if (!resp.ok) throw new Error(`MCP endpoint error: ${resp.status} ${resp.statusText}`);
    return resp.json();
  }

  private async getService(serviceId: string): Promise<ServiceDescriptor | null> {
    const services = await this.discoverServices();
    return services.find((s) => s.serviceId === serviceId) ?? null;
  }

  private async hashObject(obj: unknown): Promise<string> {
    const data = new TextEncoder().encode(JSON.stringify(obj));
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  private decodeServices(_data: unknown): ServiceDescriptor[] {
    // TODO: ABI-decode returnData from smart contract view
    // Each entry maps to ServiceDescriptor fields in order
    return [];
  }

  private decodeReputation(agent: string, _data: unknown): ReputationScore {
    // TODO: ABI-decode AgentReputation struct from returnData
    return {
      agent,
      score: 50,
      totalTasks: 0,
      successRate: 0,
      avgLatencyMs: 0,
      disputes: 0,
      stakeEgld: "0",
      lastUpdated: 0,
    };
  }
}

export default AgentBazaarSDK;
