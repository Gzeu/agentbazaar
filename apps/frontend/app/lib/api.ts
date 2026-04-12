import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Services ───────────────────────────────────────────────────────────────
export const servicesApi = {
  /** GET /api/v1/services?limit=&category= */
  list: (params?: { limit?: number; category?: string }) =>
    api.get('/api/v1/services', { params }).then(r => r.data as { services: unknown[]; total: number }),

  /** GET /api/v1/services/:id */
  get: (id: string) =>
    api.get(`/api/v1/services/${id}`).then(r => r.data),

  /** POST /api/v1/services */
  register: (data: unknown) =>
    api.post('/api/v1/services', data).then(r => r.data),
};

// ── Tasks ──────────────────────────────────────────────────────────────────
export const tasksApi = {
  /** GET /api/v1/tasks?limit=&status= */
  list: (params?: { limit?: number; status?: string }) =>
    api.get('/api/v1/tasks', { params }).then(r => r.data as { tasks: unknown[]; total: number }),

  /** GET /api/v1/tasks/:id */
  get: (id: string) =>
    api.get(`/api/v1/tasks/${id}`).then(r => r.data),

  /** POST /api/v1/tasks */
  submit: (data: unknown) =>
    api.post('/api/v1/tasks', data).then(r => r.data),

  /** POST /api/v1/tasks/:id/complete */
  complete: (id: string, data: { proofHash: string; latencyMs: number }) =>
    api.post(`/api/v1/tasks/${id}/complete`, data).then(r => r.data),
};

// ── Reputation ─────────────────────────────────────────────────────────────
export const reputationApi = {
  /** GET /api/v1/reputation/leaderboard?limit= */
  leaderboard: (limit = 20) =>
    api.get('/api/v1/reputation/leaderboard', { params: { limit } }).then(r => r.data),

  /** GET /api/v1/reputation/:address */
  get: (address: string) =>
    api.get(`/api/v1/reputation/${address}`).then(r => r.data),
};

// ── Analytics ──────────────────────────────────────────────────────────────
export const analyticsApi = {
  /** GET /api/v1/analytics */
  getDashboard: () =>
    api.get('/api/v1/analytics').then(r => r.data),

  /** GET /api/v1/analytics/categories */
  getCategories: () =>
    api.get('/api/v1/analytics/categories').then(r => r.data),

  /** GET /api/v1/analytics/volume?days= */
  getVolume: (days = 7) =>
    api.get('/api/v1/analytics/volume', { params: { days } }).then(r => r.data),
};

// ── Health ─────────────────────────────────────────────────────────────────
export const healthApi = {
  check: () => api.get('/api/v1/health').then(r => r.data),
};
