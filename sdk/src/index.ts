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

// ── MultiversX manual binary codec helpers ─────────────────────────────────
// All on-chain structs use NestedEncode (no length prefix for fixed types,
// 4-byte big-endian length prefix for variable-length types like bytes/BigUint).

/** Read a big-endian u64 (8 bytes) from buf at offset, return [value, newOffset]. */
function readU64(buf: Buffer, offset: number): [bigint, number] {
  if (offset + 8 > buf.length) throw new RangeError(`readU64: need 8 bytes at ${offset}, buf len ${buf.length}`);
  const hi = buf.readUInt32BE(offset);
  const lo = buf.readUInt32BE(offset + 4);
  return [(BigInt(hi) << 32n) | BigInt(lo), offset + 8];
}

/** Read a 4-byte big-endian length-prefixed byte slice. Returns [bytes, newOffset]. */
function readBytes(buf: Buffer, offset: number): [Buffer, number] {
  if (offset + 4 > buf.length) throw new RangeError(`readBytes: need 4 bytes at ${offset} for length, buf len ${buf.length}`);
  const len = buf.readUInt32BE(offset);
  offset += 4;
  if (offset + len > buf.length) throw new RangeError(`readBytes: need ${len} bytes at ${offset}, buf len ${buf.length}`);
  return [buf.slice(offset, offset + len), offset + len];
}

/** Read a nested-encoded BigUint (4-byte length prefix + big-endian magnitude bytes). */
function readBigUint(buf: Buffer, offset: number): [bigint, number] {
  const [bytes, newOffset] = readBytes(buf, offset);
  if (bytes.length === 0) return [0n, newOffset];
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }
  return [value, newOffset];
}

/** Read a 32-byte Address (MultiversX pubkey). Returns [bech32, newOffset]. */
function readAddress(buf: Buffer, offset: number): [string, number] {
  if (offset + 32 > buf.length) throw new RangeError(`readAddress: need 32 bytes at ${offset}, buf len ${buf.length}`);
  const pubkey = buf.slice(offset, offset + 32);
  const addr = Address.fromPublicKey(new Uint8Array(pubkey));
  return [addr.toBech32(), offset + 32];
}

/** Read a nested-encoded bool (1 byte). */
function readBool(buf: Buffer, offset: number): [boolean, number] {
  if (offset + 1 > buf.length) throw new RangeError(`readBool: need 1 byte at ${offset}, buf len ${buf.length}`);
  return [buf[offset] !== 0, offset + 1];
}

// ── Exported decode helpers (used by unit tests) ──────────────────────────

/**
 * Decodes a base64-encoded AgentReputation struct (TopDecode / NestedDecode layout).
 * Field order (from contracts/reputation/src/storage.rs):
 *   total_tasks(u64), successful_tasks(u64), failed_tasks(u64), disputes(u64),
 *   score(u64), stake(BigUint), total_latency_ms(u64), last_updated(u64)
 */
export function decodeReputationStruct(
  agent: string,
  base64: string
): ReputationScore {
  const buf = Buffer.from(base64, "base64");
  let offset = 0;

  let totalTasks: bigint, successfulTasks: bigint, failedTasks: bigint;
  let disputes: bigint, score: bigint, stake: bigint;
  let totalLatencyMs: bigint, lastUpdated: bigint;

  [totalTasks, offset] = readU64(buf, offset);
  [successfulTasks, offset] = readU64(buf, offset);
  [failedTasks, offset] = readU64(buf, offset);
  [disputes, offset] = readU64(buf, offset);
  [score, offset] = readU64(buf, offset);
  [stake, offset] = readBigUint(buf, offset);
  [totalLatencyMs, offset] = readU64(buf, offset);
  [lastUpdated] = readU64(buf, offset);

  const totalTasksNum = Number(totalTasks);
  const successRate = totalTasksNum > 0
    ? Number(successfulTasks) / totalTasksNum
    : 0;
  const avgLatencyMs = totalTasksNum > 0
    ? Number(totalLatencyMs) / totalTasksNum
    : 0;

  return {
    agent,
    score: Number(score),
    totalTasks: totalTasksNum,
    successRate,
    avgLatencyMs,
    disputes: Number(disputes),
    stakeEgld: stake.toString(),
    lastUpdated: Number(lastUpdated),
  };
}

/**
 * Decodes a base64-encoded ServiceRecord struct (NestedDecode layout).
 * Field order (from contracts/output/registry.abi.json types.ServiceRecord):
 *   provider(Address/32 bytes), name(bytes), category(bytes), endpoint_url(bytes),
 *   pricing_model(bytes), price(BigUint), metadata_uri(bytes), stake(BigUint),
 *   active(bool), registered_at(u64)
 */
export function decodeServiceRecord(
  serviceId: string,
  base64: string
): ServiceDescriptor {
  const buf = Buffer.from(base64, "base64");
  let offset = 0;

  let provider: string;
  let nameBuf: Buffer, categoryBuf: Buffer, endpointBuf: Buffer;
  let pricingModelBuf: Buffer, metadataBuf: Buffer;
  let price: bigint, stake: bigint;
  let active: boolean;
  let registeredAt: bigint;

  [provider, offset] = readAddress(buf, offset);
  [nameBuf, offset] = readBytes(buf, offset);
  [categoryBuf, offset] = readBytes(buf, offset);
  [endpointBuf, offset] = readBytes(buf, offset);
  [pricingModelBuf, offset] = readBytes(buf, offset);
  void pricingModelBuf; // not mapped to ServiceDescriptor
  [price, offset] = readBigUint(buf, offset);
  [metadataBuf, offset] = readBytes(buf, offset);
  [stake, offset] = readBigUint(buf, offset);
  void stake; // stored on-chain, not in ServiceDescriptor
  [active, offset] = readBool(buf, offset);
  [registeredAt] = readU64(buf, offset);
  void registeredAt; // not in ServiceDescriptor

  return {
    serviceId,
    name: nameBuf.toString("utf8"),
    category: categoryBuf.toString("utf8") as ServiceCategory,
    description: "",
    pricePerCall: price.toString(),
    endpoint: endpointBuf.toString("utf8"),
    inputSchema: {},
    outputSchema: {},
    maxLatencyMs: 0,
    metadataHash: metadataBuf.toString("utf8"),
    provider,
    active,
  };
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
    console.log(`[AgentBazaar] registerService tx ready for ${signerAddress}`);
    return JSON.stringify(tx);
  }

  // ── Consumer: Discover services ───────────────────────────────────────────
  /**
   * Discovers services registered on-chain.
   *
   * LIMITATION: The registry contract does not expose a global enumeration
   * endpoint (no getAllServices / getServicesByCategory view). Global discovery
   * without a provider address is therefore NOT supported by the current contract.
   *
   * When `provider` (bech32) is given:
   *   1. Calls getServicesByProvider(provider) → variadic<bytes> (service IDs)
   *   2. For each service_id, calls getService(id) → optional<ServiceRecord>
   *   3. Decodes each ServiceRecord and maps to ServiceDescriptor
   *   4. Optionally filters by `category` in TypeScript
   *
   * When only `category` is given (no provider), returns [] with a console.warn.
   */
  async discoverServices(
    category?: ServiceCategory,
    provider?: string
  ): Promise<ServiceDescriptor[]> {
    if (!provider) {
      console.warn(
        "[AgentBazaar] discoverServices: global service enumeration is not supported " +
          "by the registry contract. Pass a provider address (bech32) to list services by provider."
      );
      return [];
    }

    try {
      // Step 1: get all service IDs for this provider
      const providerHex = Address.fromBech32(provider).hex();
      const idsResp = await fetch(`${this.config.networkUrl}/vm-values/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scAddress: this.config.registryAddress,
          funcName: "getServicesByProvider",
          args: [providerHex],
        }),
      });
      const idsData = await idsResp.json() as { data?: { data?: { returnData?: string[] } } };
      const serviceIdEntries: string[] =
        idsData?.data?.data?.returnData ?? [];

      if (serviceIdEntries.length === 0) return [];

      // Step 2: for each service_id (base64 bytes), call getService
      const results: ServiceDescriptor[] = [];
      for (const idBase64 of serviceIdEntries) {
        const idHex = Buffer.from(idBase64, "base64").toString("hex");
        const svcResp = await fetch(`${this.config.networkUrl}/vm-values/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scAddress: this.config.registryAddress,
            funcName: "getService",
            args: [idHex],
          }),
        });
        const svcData = await svcResp.json() as { data?: { data?: { returnData?: string[] } } };
        const returnData = svcData?.data?.data?.returnData ?? [];
        if (returnData.length === 0) continue; // optional<ServiceRecord> empty → not found

        // getService returns optional<ServiceRecord>; first returnData element is the encoded struct
        const serviceId = Buffer.from(idBase64, "base64").toString("utf8");
        try {
          const descriptor = decodeServiceRecord(serviceId, returnData[0]);
          results.push(descriptor);
        } catch (e) {
          console.error(`[AgentBazaar] decodeServiceRecord failed for ${serviceId}:`, e);
        }
      }

      // Step 3: optional category filter in TypeScript
      return category
        ? results.filter((s) => s.category === category)
        : results;
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

    if (mandate) {
      const { valid, reason } = await this.validateMandate(mandate, serviceId, priceEgld);
      if (!valid) throw new Error(`AP2 mandate rejected: ${reason}`);
    }

    const service = await this.getService(serviceId);
    if (!service) throw new Error(`Service not found: ${serviceId}`);

    const taskId = `task-${serviceId}-${Date.now()}`;

    const inputHash = await this.hashObject(inputPayload);
    const escrowArgs = [serviceId, service.provider ?? "", inputHash]
      .map((a) => Buffer.from(a).toString("hex"))
      .join("@");
    const escrowTxData = `createTask@${escrowArgs}`;
    console.log(`[AgentBazaar] Escrow tx: ${escrowTxData}`);

    const result = await this.callMCPEndpoint(service.endpoint, inputPayload, taskId);
    const resultHash = await this.hashObject(result);

    const releaseArgs = [
      Buffer.from(taskId).toString("hex"),
      Buffer.from(resultHash).toString("hex"),
    ].join("@");
    console.log(`[AgentBazaar] Release tx: releaseTask@${releaseArgs}`);

    const latencyMs = Date.now() - start;

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
      const data = await resp.json() as { data?: { data?: { returnData?: string[] } } };
      return this.decodeReputation(agentAddress, data);
    } catch {
      return this.reputationFallback(agentAddress);
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
    try {
      const idHex = Buffer.from(serviceId).toString("hex");
      const resp = await fetch(`${this.config.networkUrl}/vm-values/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scAddress: this.config.registryAddress,
          funcName: "getService",
          args: [idHex],
        }),
      });
      const data = await resp.json() as { data?: { data?: { returnData?: string[] } } };
      const returnData = data?.data?.data?.returnData ?? [];
      if (returnData.length === 0) return null;
      return decodeServiceRecord(serviceId, returnData[0]);
    } catch {
      return null;
    }
  }

  private async hashObject(obj: unknown): Promise<string> {
    const data = new TextEncoder().encode(JSON.stringify(obj));
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  private decodeReputation(
    agent: string,
    data: { data?: { data?: { returnData?: string[] } } }
  ): ReputationScore {
    const returnData = data?.data?.data?.returnData ?? [];
    if (returnData.length === 0 || !returnData[0]) {
      return this.reputationFallback(agent);
    }
    try {
      return decodeReputationStruct(agent, returnData[0]);
    } catch (e) {
      console.error("[AgentBazaar] decodeReputation failed:", e);
      return this.reputationFallback(agent);
    }
  }

  private reputationFallback(agent: string): ReputationScore {
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

  /** @deprecated Use discoverServices(category, provider) instead. */
  private decodeServices(_data: unknown): ServiceDescriptor[] {
    return [];
  }
}

export default AgentBazaarSDK;
