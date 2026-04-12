export type ServiceCategory =
  | 'data'
  | 'compute'
  | 'compliance'
  | 'wallet-actions'
  | 'enrichment'
  | 'orchestration'
  | 'notifications';

export interface Service {
  id:               string;
  name:             string;
  description:      string;
  category:         ServiceCategory;
  providerAddress:  string;
  endpoint:         string;
  pricingModel:     string;
  priceAmount:      string;
  priceToken:       string;
  maxLatencyMs:     number;
  uptimeGuarantee:  number;
  reputationScore:  number; // bps 0-10000
  active:           boolean;
  createdAt:        string; // ISO — was 'registeredAt', now aligned to backend
  totalTasks:       number;
  ucpCompatible:    boolean;
  mcpCompatible:    boolean;
  tags:             string[];
}

/** All statuses that backend can return — keep in sync with tasks.service.ts */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'disputed' | 'refunded';

/** Filter options for the task list UI (superset of TaskStatus + 'all') */
export type TaskFilter = 'all' | 'pending' | 'running' | 'completed' | 'failed' | 'disputed' | 'refunded';

export interface Task {
  id:              string;
  serviceId:       string;
  consumerId:      string;
  providerAddress: string;
  maxBudget:       string;
  status:          TaskStatus;
  payloadHash?:    string;
  proofHash?:      string;
  escrowTxHash?:   string;
  latencyMs?:      number;
  createdAt:       string;
  updatedAt:       string;
  deadline:        string;
}

export interface ReputationRecord {
  agentAddress:    string;
  compositeScore:  number; // bps 0-10000
  completionRate:  number; // 0.0-1.0
  totalTasks:      number;
  successfulTasks: number;
  avgLatencyMs:    number;
  slashed:         boolean;
}

export interface AnalyticsDashboard {
  timestamp: string;
  tasks: {
    total:          number;
    completed:      number;
    failed:         number;
    running:        number;
    pending:        number;
    disputed:       number;
    completionRate: number;
    avgLatencyMs:   number;
  };
  tvl: { wei: string; egld: string };
  services: { total: number; active: number };
  reputation: { totalProviders: number; avgScore: number; topScore: number };
}

export interface VolumePoint {
  date:        string;
  tasks:       number;
  completed:   number;
  volumeEgld:  number;
}
