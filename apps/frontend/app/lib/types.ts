// ─── Service ─────────────────────────────────────────────────────────────────

/** Slugs must match backend ServicesService category values */
export type ServiceCategory =
  | 'data'
  | 'compute'
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
  providerAddress: string;
  endpoint: string;
  pricingModel: string;
  priceAmount: string;
  priceToken: string;
  maxLatencyMs: number;
  uptimeGuarantee: number;
  reputationScore: number;
  active: boolean;
  createdAt: string;
  totalTasks: number;
  ucpCompatible: boolean;
  mcpCompatible: boolean;
  tags: string[];
}

// ─── Task ─────────────────────────────────────────────────────────────────────

/** Keep in sync with TasksService (backend) and Escrow contract */
export type TaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'disputed'
  | 'refunded';

export interface Task {
  id: string;
  serviceId: string;
  consumerId: string;
  providerAddress: string;
  maxBudget: string;
  status: TaskStatus;
  payloadHash?: string;
  proofHash?: string;
  escrowTxHash?: string;
  latencyMs?: number;
  disputeReason?: string;
  createdAt: string;
  updatedAt: string;
  deadline: string;
}

export interface TaskListResponse {
  data: Task[];
  total: number;
  nextCursor: string | null;
}

// ─── Reputation ──────────────────────────────────────────────────────────────

export interface ReputationRecord {
  agentAddress: string;
  totalTasks: number;
  successfulTasks: number;
  avgLatencyMs: number;
  compositeScore: number;
  completionRate: number;
  slashed: boolean;
  syncedAt?: string;
}

// ─── Dispute ─────────────────────────────────────────────────────────────────

export interface DisputeVote {
  taskId: string;
  votesForBuyer: number;
  votesForProvider: number;
  resolved: boolean;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export interface Provider {
  address: string;
  name: string;
  reputationScore: number;
  totalTasks: number;
  activeServices: number;
  joinedAt: string;
}
