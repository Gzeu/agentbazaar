import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// --- Services ---
export const servicesApi = {
  list: (filters?: Record<string, unknown>) =>
    api.get('/api/v1/services', { params: filters }).then((r) => r.data),

  get: (id: string) =>
    api.get(`/api/v1/services/${id}`).then((r) => r.data),

  register: (data: unknown) =>
    api.post('/api/v1/services/register', data).then((r) => r.data),

  update: (id: string, data: unknown) =>
    api.put(`/api/v1/services/${id}`, data).then((r) => r.data),

  deregister: (id: string) =>
    api.delete(`/api/v1/services/${id}`).then((r) => r.data),

  quote: (id: string) =>
    api.get(`/api/v1/services/${id}/quote`).then((r) => r.data),
};

// --- Discovery ---
export const discoveryApi = {
  discover: (params: Record<string, unknown>) =>
    api.get('/api/v1/discover', { params }).then((r) => r.data),

  categories: () =>
    api.get('/api/v1/discover/categories').then((r) => r.data),
};

// --- Tasks ---
export const tasksApi = {
  submit: (data: unknown) =>
    api.post('/api/v1/tasks', data).then((r) => r.data),

  get: (id: string) =>
    api.get(`/api/v1/tasks/${id}`).then((r) => r.data),

  submitProof: (id: string, data: unknown) =>
    api.post(`/api/v1/tasks/${id}/proof`, data).then((r) => r.data),

  byConsumer: (address: string) =>
    api.get(`/api/v1/tasks/consumer/${address}`).then((r) => r.data),

  byProvider: (address: string) =>
    api.get(`/api/v1/tasks/provider/${address}`).then((r) => r.data),
};

// --- Reputation ---
export const reputationApi = {
  get: (address: string) =>
    api.get(`/api/v1/reputation/${address}`).then((r) => r.data),

  history: (address: string) =>
    api.get(`/api/v1/reputation/${address}/history`).then((r) => r.data),
};
