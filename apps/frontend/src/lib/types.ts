export type ServiceCategory =
  | 'data-fetching'
  | 'compute-offload'
  | 'wallet-actions'
  | 'compliance'
  | 'enrichment'
  | 'orchestration'
  | 'notifications';

export interface Service {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  version: string;
  providerAddress: string;
  endpoint: string;
  pricingModel: string;
  priceAmount: string;
  priceToken: string;
  maxLatencyMs: number;
  uptimeGuarantee: number;
  reputationScore: number; // 0-10000 bps
  active: boolean;
  registeredAt: string;
  totalTasks: number;
  ucpCompatible: boolean;
  mcpCompatible: boolean;
  tags: string[];
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'disputed';

export interface Task {
  id: string;
  serviceId: string;
  consumerId: string;
  providerAddress: string;
  payload: Record<string, unknown>;
  maxBudget: string;
  status: TaskStatus;
  proofHash?: string;
  result?: Record<string, unknown>;
  latencyMs?: number;
  createdAt: string;
  updatedAt: string;
  deadline: string;
}

export interface ReputationRecord {
  agentAddress: string;
  totalTasks: number;
  successfulTasks: number;
  disputedTasks: number;
  avgLatencyMs: number;
  compositeScore: number;
  completionRate: number;
  lastUpdated: string;
  slashed: boolean;
}
