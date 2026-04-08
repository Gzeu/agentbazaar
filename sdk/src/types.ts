export type NetworkName = "devnet" | "testnet" | "mainnet";

export interface AddressBook {
  registry?: string;
  escrow?: string;
  reputation?: string;
}

export interface DevnetConfig {
  network: NetworkName;
  chainId: string;
  proxy: string;
  explorer: string;
  api?: string;
  addresses: AddressBook;
}

export interface ServiceDescriptor {
  serviceId?: string;
  provider: string;
  name: string;
  category: string;
  description?: string;
  endpoint: string;
  mcpEndpoint?: string;
  ucpSchema?: string;
  version?: string;
  pricingModel: "fixed" | "usage" | "subscription" | "quote";
  price?: string;
  currency?: string;
  metadataUri?: string;
  capabilities?: string[];
  tags?: string[];
  slaMs?: number;
  reputationScore?: number;
  active?: boolean;
}

export interface DiscoveryFilters {
  category?: string;
  pricingModel?: ServiceDescriptor["pricingModel"];
  provider?: string;
  tags?: string[];
  minReputation?: number;
  activeOnly?: boolean;
  search?: string;
}

export interface QuoteRequest {
  serviceId: string;
  buyer: string;
  inputSchema?: string;
  payloadHash?: string;
  constraints?: Record<string, string | number | boolean>;
  maxPrice?: string;
  deadline?: number;
}

export interface QuoteResponse {
  quoteId: string;
  serviceId: string;
  provider: string;
  price: string;
  currency: string;
  expiresAt: number;
  termsHash?: string;
  settlementMethod: "x402" | "acp" | "escrow";
}

export interface X402PaymentRequest {
  resource: string;
  amount: string;
  currency: string;
  payer: string;
  payee: string;
  nonce?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface X402PaymentReceipt {
  paymentId: string;
  resource: string;
  amount: string;
  currency: string;
  payer: string;
  payee: string;
  status: "authorized" | "captured" | "failed";
  signature: string;
  createdAt: number;
}

export interface ACPCheckoutSession {
  sessionId: string;
  buyer: string;
  provider: string;
  amount: string;
  currency: string;
  redirectUrl?: string;
  returnUrl?: string;
  status: "pending" | "authorized" | "captured" | "cancelled";
  metadata?: Record<string, string>;
}

export interface AP2Mandate {
  mandateId: string;
  owner: string;
  delegate: string;
  maxAmount: string;
  currency: string;
  allowedCategories?: string[];
  allowedServices?: string[];
  validFrom: number;
  validUntil: number;
  dailyLimit?: string;
  metadata?: Record<string, string>;
  revoked?: boolean;
}

export interface MandateValidationResult {
  valid: boolean;
  reason?: string;
  remainingAllowance?: string;
}

export interface TaskRequest {
  taskId?: string;
  serviceId: string;
  buyer: string;
  provider?: string;
  quoteId?: string;
  input: unknown;
  paymentMethod: "x402" | "acp" | "escrow";
  amount?: string;
  currency?: string;
  escrowId?: string;
  callbackUrl?: string;
  metadata?: Record<string, string>;
}

export interface TaskResult {
  taskId: string;
  status: "pending" | "running" | "completed" | "failed" | "disputed";
  output?: unknown;
  proofHash?: string;
  latencyMs?: number;
  error?: string;
  completedAt?: number;
}

export interface ReputationRecord {
  address: string;
  score: number;
  completedTasks: number;
  failedTasks: number;
  disputedTasks: number;
  medianLatencyMs?: number;
  stake?: string;
  updatedAt: number;
}

export interface MCPToolCall {
  tool: string;
  args?: Record<string, unknown>;
}

export interface MCPExecutionRequest {
  serviceId: string;
  taskId: string;
  toolCalls: MCPToolCall[];
  context?: Record<string, unknown>;
}

export interface MCPExecutionResponse {
  taskId: string;
  success: boolean;
  outputs: Array<Record<string, unknown>>;
  proofHash?: string;
  error?: string;
}

export interface UCPServiceRecord {
  id: string;
  title: string;
  summary?: string;
  provider: string;
  endpoint: string;
  category?: string;
  tags?: string[];
  price?: string;
  currency?: string;
  reputationScore?: number;
}

export interface ProviderAgentOptions {
  providerAddress: string;
  service: ServiceDescriptor;
  execute: (task: TaskRequest) => Promise<TaskResult>;
}

export interface ConsumerAgentOptions {
  buyerAddress: string;
  defaultCurrency?: string;
}
