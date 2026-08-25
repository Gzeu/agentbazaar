/**
 * Thin typed REST client for the AgentBazaar orchestration API.
 * Mirrors the backend controllers (prefix /api/v1).
 */
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

const BASE = `${BACKEND_URL}/api/v1`;

const TOKEN_KEY = "ab:token";
export const auth = {
  getToken: () =>
    typeof window !== "undefined"
      ? window.localStorage.getItem(TOKEN_KEY)
      : null,
  setToken: (t: string) => {
    if (typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, t);
  },
  clearToken: () => {
    if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
  },
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const tok = auth.getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
    },
    ...init,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `API ${res.status}: ${path}`);
  }
  return (await res.json()) as T;
}

// ── Types ────────────────────────────────────────────────────────────────────
export type TaskStatus = "pending" | "running" | "completed" | "failed" | "disputed" | "refunded";

export interface TaskRecord {
  id: string;
  serviceId: string;
  consumerId: string;
  providerAddress: string;
  status: TaskStatus;
  maxBudget: string;
  proofHash?: string;
  escrowTxHash?: string;
  latencyMs?: number;
  disputeReason?: string;
  onChainVerified?: boolean;
  createdAt: string;
  updatedAt: string;
  deadline: string;
}

// ── Tasks ────────────────────────────────────────────────────────────────────
export interface CompletePayload {
  proofHash: string;
  latencyMs?: number;
}

export const tasksApi = {
  list(opts: { limit?: number; status?: TaskStatus; after?: string } = {}) {
    const q = new URLSearchParams();
    if (opts.limit) q.set("limit", String(opts.limit));
    if (opts.status) q.set("status", opts.status);
    if (opts.after) q.set("after", opts.after);
    return request<{ data: TaskRecord[]; total: number; nextCursor?: string | null }>(
      `/tasks?${q.toString()}`,
    );
  },

  get(id: string) {
    return request<TaskRecord>(`/tasks/${encodeURIComponent(id)}`);
  },

  complete(id: string, payload: CompletePayload) {
    return request<TaskRecord>(`/tasks/${encodeURIComponent(id)}/complete`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  dispute(id: string, reason: string) {
    return request<TaskRecord>(`/tasks/${encodeURIComponent(id)}/dispute`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  refund(id: string) {
    return request<TaskRecord>(`/tasks/${encodeURIComponent(id)}/refund`, {
      method: "POST",
    });
  },
};

// ── Analytics ────────────────────────────────────────────────────────────────
export interface DashboardSnapshot {
  timestamp: string;
  tasks: {
    total: number; completed: number; failed: number;
    running: number; pending: number; disputed: number;
    completionRate: number; avgLatencyMs: number;
  };
  tvl: { wei: string; egld: string };
  services: { total: number; active: number };
}

export interface CategoryBreakdown {
  categories: Record<string, { services: number; tasks: number }>;
  timestamp: string;
}

export interface VolumePoint {
  date: string; tasks: number; completed: number; volumeEgld: number;
}

export const analyticsApi = {
  dashboard() {
    return request<DashboardSnapshot>(`/analytics`);
  },
  categories() {
    return request<CategoryBreakdown>(`/analytics/categories`);
  },
  volume(days = 7) {
    return request<{ days: number; series: VolumePoint[] }>(
      `/analytics/volume?days=${days}`,
    );
  },
};

// ── Services (provider side) ─────────────────────────────────────────────────
export interface RegisterServicePayload {
  name: string;
  category: string;
  description?: string;
  providerAddress: string;
  endpoint: string;
  pricingModel?: string;
  priceAmount: string;
  maxLatencyMs?: number;
  tags?: string[];
}

export const servicesApi = {
  authLogin(address: string, providerMode = false) {
    return request<{ access_token: string; token_type: "Bearer"; role: string }>(
      `/auth/login`,
      {
        method: "POST",
        body: JSON.stringify({ address, providerMode }),
      },
    );
  },

  register(payload: RegisterServicePayload) {
    return request<{ id: string }>(`/services`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  list(opts: { limit?: number } = {}) {
    return request<{ data: ServiceRecord[]; total: number }>(
      `/services?limit=${opts.limit ?? 100}`,
    );
  },

  deregister(id: string) {
    return request<{ success: boolean }>(`/services/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};

export interface ServiceRecord {
  id: string;
  name: string;
  description?: string;
  category: string;
  version?: string;
  providerAddress: string;
  endpoint: string;
  pricingModel?: string;
  priceAmount?: string;
  priceToken?: string;
  maxLatencyMs?: number;
  uptimeGuarantee?: number;
  tags?: string[];
  active: boolean;
  reputationScore?: number;   // bps 0-10000
  totalTasks?: number;
  successfulTasks?: number;
}

export interface ReputationEntry {
  agentAddress: string;
  compositeScore: number;
  completionRate: number;
  totalTasks: number;
  successfulTasks: number;
  avgLatencyMs: number;
  slashed: boolean;
  syncedAt?: string;
}

export const reputationApi = {
  leaderboard(limit = 10) {
    return request<ReputationEntry[]>(`/reputation?limit=${limit}`);
  },
  forAgent(address: string) {
    return request<ReputationEntry>(`/reputation/${encodeURIComponent(address)}`);
  },
};
