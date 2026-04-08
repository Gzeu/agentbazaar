export interface ServiceRecord {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  providerAddress: string;
  endpoint: string;
  pricingModel: string;
  priceAmount: string;
  priceToken: string;
  maxLatencyMs: number;
  uptimeGuarantee: number;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  stakeAmount: string;
  ucpCompatible: boolean;
  mcpCompatible: boolean;
  tags: string[];
  reputationScore: number;
  active: boolean;
  registeredAt: string;
  totalTasks: number;
}

export interface TaskRecord {
  id: string;
  serviceId: string;
  consumerId: string;
  providerAddress: string;
  payload: Record<string, unknown>;
  maxBudget: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'disputed';
  proofHash?: string;
  result?: Record<string, unknown>;
  latencyMs?: number;
  createdAt: string;
  updatedAt: string;
  deadline: string;
}
