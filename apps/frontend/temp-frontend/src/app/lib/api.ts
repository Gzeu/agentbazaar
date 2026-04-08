/**
 * AgentBazaar — typed API client for NestJS backend
 * Base URL from NEXT_PUBLIC_BACKEND_URL (default: http://localhost:3001)
 */

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ------------------------------------------------------------------ Services
export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  providerAddress: string;
  endpoint: string;
  pricingModel: string;
  priceAmount: string;
  priceToken: string;
  maxLatencyMs: number;
  uptimeGuarantee: number;
  reputationScore: number;
  totalTasks: number;
  ucpCompatible: boolean;
  mcpCompatible: boolean;
  tags: string[];
  active: boolean;
  createdAt: string;
}

export const servicesApi = {
  list:   (category?: string, limit = 50) =>
    req<{ data: Service[]; total: number }>(
      `/services?limit=${limit}${category ? `&category=${category}` : ''}`
    ),
  get:    (id: string) => req<Service>(`/services/${id}`),
  create: (body: Partial<Service>) =>
    req<Service>('/services', { method: 'POST', body: JSON.stringify(body) }),
};

// ------------------------------------------------------------------ Tasks
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'disputed';

export interface Task {
  id: string;
  serviceId: string;
  consumerId: string;
  providerAddress: string;
  status: TaskStatus;
  maxBudget: string;
  payloadHash?: string;
  proofHash?: string;
  escrowTxHash?: string;
  latencyMs?: number;
  createdAt: string;
  updatedAt: string;
  deadline: string;
}

export const tasksApi = {
  list:   (limit = 50, status?: string) =>
    req<{ data: Task[]; total: number }>(
      `/tasks?limit=${limit}${status ? `&status=${status}` : ''}`
    ),
  get:    (id: string) => req<Task>(`/tasks/${id}`),
  create: (body: Partial<Task>) =>
    req<Task>('/tasks', { method: 'POST', body: JSON.stringify(body) }),
  complete: (id: string, proofHash: string, latencyMs: number) =>
    req<Task>(`/tasks/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ proofHash, latencyMs }),
    }),
};

// ------------------------------------------------------------------ Reputation
export interface ReputationEntry {
  agentAddress: string;
  compositeScore: number;
  completionRate: number;
  totalTasks: number;
  successfulTasks: number;
  avgLatencyMs: number;
  slashed: boolean;
}

export const reputationApi = {
  leaderboard: (limit = 20) =>
    req<ReputationEntry[]>(`/reputation/leaderboard?limit=${limit}`),
  get: (address: string) =>
    req<ReputationEntry>(`/reputation/${address}`),
};

// ------------------------------------------------------------------ Discovery
export interface DiscoveryQuery {
  category?:     string;
  maxLatencyMs?: number;
  minScore?:     number;
  ucpRequired?:  boolean;
  mcpRequired?:  boolean;
}

export const discoveryApi = {
  discover: (q: DiscoveryQuery = {}) => {
    const p = new URLSearchParams();
    if (q.category)     p.set('category',   q.category);
    if (q.maxLatencyMs) p.set('maxLatency', String(q.maxLatencyMs));
    if (q.minScore)     p.set('minScore',   String(q.minScore));
    if (q.ucpRequired)  p.set('ucp', 'true');
    if (q.mcpRequired)  p.set('mcp', 'true');
    return req<{ query: DiscoveryQuery; results: Service[]; count: number; timestamp: string }>(
      `/discovery?${p.toString()}`
    );
  },
};

// ------------------------------------------------------------------ Health
export interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
  network: string;
  contractsConfigured: boolean;
  multiversxReachable: boolean;
  contracts: { registry: string; escrow: string; reputation: string };
}

export const healthApi = {
  get: () => req<HealthStatus>('/health'),
};
