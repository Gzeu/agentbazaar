// Shared types used across contracts, SDK, and frontend

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

export interface ServiceListing {
  serviceId: string;
  provider: string;
  name: string;
  category: ServiceCategory;
  description: string;
  pricePerCall: string;
  endpoint: string;
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
  maxLatencyMs: number;
  minStakeRequired: string;
  metadataHash: string;
  active: boolean;
  createdAt: number;
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

export interface ReputationScore {
  agent: string;
  score: number;
  totalTasks: number;
  successRate: number;
  avgLatencyMs: number;
  disputes: number;
  stakeEgld: string;
  lastUpdated: number;
}

export interface QuoteRequest {
  serviceId: string;
  consumer: string;
  inputPayload: Record<string, unknown>;
  maxPrice: string;
  deadline: number;
}

export interface QuoteResponse {
  quoteId: string;
  price: string;
  estimatedLatencyMs: number;
  validUntil: number;
  providerSignature?: string;
}

export interface MandateConfig {
  consumer: string;
  maxSpendPerTask: string;
  maxSpendTotal: string;
  allowedCategories: ServiceCategory[];
  expiresAt: number;
}

export interface JsonSchema {
  type: string;
  properties?: Record<string, { type: string; description?: string }>;
  required?: string[];
}

export interface AgentBazaarConfig {
  networkUrl: string;
  registryAddress: string;
  escrowAddress: string;
  reputationAddress: string;
  chainId: string;
}

export interface MarketplaceFeeConfig {
  feePercent: number; // basis points, e.g. 100 = 1%
  feeCollector: string;
  minimumFeeEgld: string;
}

export interface DisputeRecord {
  taskId: string;
  consumer: string;
  provider: string;
  openedAt: number;
  resolvedAt?: number;
  resolution?: "consumer" | "provider" | "split";
  evidence?: string;
}
