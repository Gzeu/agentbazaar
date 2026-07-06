import axios, { AxiosError } from 'axios';
import type { Service, Task, TaskListResponse, ReputationRecord, Provider } from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: BASE,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Global error interceptor — normalises error messages
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ message?: string | string[] }>) => {
    const msg = err.response?.data?.message ?? err.message;
    return Promise.reject(new Error(Array.isArray(msg) ? msg.join(', ') : String(msg)));
  },
);

// ─── Services ────────────────────────────────────────────────────────────────

export const servicesApi = {
  /** GET /api/v1/services?category=…&limit=…&active=… */
  list: (params?: { category?: string; limit?: number; active?: boolean }) =>
    api.get<{ data: Service[]; total: number }>('/api/v1/services', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Service>(`/api/v1/services/${id}`).then((r) => r.data),

  /** POST /api/v1/services */
  register: (data: Partial<Service>) =>
    api.post<Service>('/api/v1/services', data).then((r) => r.data),

  update: (id: string, data: Partial<Service>) =>
    api.put<Service>(`/api/v1/services/${id}`, data).then((r) => r.data),

  deregister: (id: string) =>
    api.delete(`/api/v1/services/${id}`).then((r) => r.data),
};

// ─── Tasks ───────────────────────────────────────────────────────────────────

export const tasksApi = {
  /** GET /api/v1/tasks?limit=…&status=…&after=… */
  list: (params?: { limit?: number; status?: string; after?: string }) =>
    api.get<TaskListResponse>('/api/v1/tasks', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Task>(`/api/v1/tasks/${id}`).then((r) => r.data),

  /** POST /api/v1/tasks */
  create: (data: {
    serviceId: string;
    consumerId: string;
    providerAddress: string;
    maxBudget: string;
    payloadHash?: string;
    escrowTxHash?: string;
    deadline?: string;
  }) => api.post<Task>('/api/v1/tasks', data).then((r) => r.data),

  /** POST /api/v1/tasks/:id/complete */
  complete: (id: string, proofHash: string, latencyMs: number) =>
    api.post<Task>(`/api/v1/tasks/${id}/complete`, { proofHash, latencyMs }).then((r) => r.data),

  /** POST /api/v1/tasks/:id/dispute */
  dispute: (id: string, reason: string) =>
    api.post<Task>(`/api/v1/tasks/${id}/dispute`, { reason }).then((r) => r.data),

  /** POST /api/v1/tasks/:id/refund */
  refund: (id: string) =>
    api.post<Task>(`/api/v1/tasks/${id}/refund`).then((r) => r.data),
};

// ─── Reputation ──────────────────────────────────────────────────────────────

export const reputationApi = {
  get: (address: string) =>
    api.get<ReputationRecord>(`/api/v1/reputation/${address}`).then((r) => r.data),

  leaderboard: (limit = 10) =>
    api.get<ReputationRecord[]>('/api/v1/reputation', { params: { limit } }).then((r) => r.data),
};

// ─── Providers ───────────────────────────────────────────────────────────────

export const providersApi = {
  list: (params?: { limit?: number }) =>
    api.get<{ data: Provider[]; total: number }>('/api/v1/providers', { params }).then((r) => r.data),

  get: (address: string) =>
    api.get<Provider>(`/api/v1/providers/${address}`).then((r) => r.data),
};

// ─── Discovery ───────────────────────────────────────────────────────────────

export const discoveryApi = {
  discover: (params: Record<string, unknown>) =>
    api.get('/api/v1/discover', { params }).then((r) => r.data),

  categories: () =>
    api.get('/api/v1/discover/categories').then((r) => r.data),
};
