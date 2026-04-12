import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'disputed';

export interface Task {
  id: string;
  serviceId: string;
  consumerId: string;
  providerAddress: string;
  status: TaskStatus;
  maxBudget: string;
  proofHash?: string;
  escrowTxHash?: string;
  latencyMs?: number;
  onChainVerified: boolean;
  createdAt: string;
  updatedAt: string;
  deadline: string;
}

export interface TaskMetrics {
  total: number; completed: number; failed: number;
  pending: number; running: number; disputed: number;
  successRate: number; avgLatencyMs: number; onChainVerifiedRate: number;
}

export function useTasks(opts?: { status?: TaskStatus; limit?: number }, pollMs = 8_000) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    const params = new URLSearchParams();
    if (opts?.status) params.set('status', opts.status);
    if (opts?.limit)  params.set('limit', String(opts.limit));
    try {
      const res = await fetch(`${API}/tasks?${params}`);
      const j = await res.json();
      setTasks(j.data ?? []);
      setTotal(j.total ?? 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [opts?.status, opts?.limit]);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, pollMs);
    return () => clearInterval(id);
  }, [fetch_, pollMs]);

  return { tasks, total, loading, refetch: fetch_ };
}

export function useTaskMetrics(pollMs = 10_000) {
  const [metrics, setMetrics] = useState<TaskMetrics | null>(null);

  useEffect(() => {
    const load = () =>
      fetch(`${API}/tasks/metrics`)
        .then(r => r.json())
        .then(setMetrics)
        .catch(() => {});
    load();
    const id = setInterval(load, pollMs);
    return () => clearInterval(id);
  }, [pollMs]);

  return metrics;
}

export async function submitTask(body: Partial<Task> & Record<string, unknown>) {
  const res = await fetch(`${API}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Submit failed: ${res.status}`);
  return res.json() as Promise<Task>;
}
