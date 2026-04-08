/**
 * AgentBazaar Core Types
 */

export interface ServiceDescriptor {
  id: string;
  name: string;
  category: ServiceCategory;
  version: string;
  provider: string; // erd1... address
  endpoint: string;
  pricing: PricingModel;
  sla: SLASpec;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  mandateRequirements: MandateRequirements;
  ucpCompatible: boolean;
  mcpCompatible: boolean;
  reputationScore: number;
  stake: string;
}

export type ServiceCategory =
  | 'data-fetching'
  | 'compute-offload'
  | 'wallet-actions'
  | 'compliance'
  | 'enrichment'
  | 'orchestration'
  | 'notifications';

export interface PricingModel {
  model: 'per_request' | 'per_second' | 'per_result' | 'subscription';
  amount: string;
  token: 'EGLD' | string;
}

export interface SLASpec {
  maxLatencyMs: number;
  uptimeGuarantee: number;
}

export interface MandateRequirements {
  ap2Scope: string[];
  maxSpendPerSession: string;
}

export interface TaskRequest {
  serviceId: string;
  consumerId: string;
  payload: Record<string, unknown>;
  maxBudget: string;
  deadlineMs?: number;
}

export interface TaskResult {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: Record<string, unknown>;
  proofHash?: string;
  executedAt?: number;
}

export interface ReputationScore {
  agentAddress: string;
  completionRate: number;
  disputeRate: number;
  medianLatencyMs: number;
  totalTasks: number;
  compositeScore: number;
  lastUpdated: number;
}
