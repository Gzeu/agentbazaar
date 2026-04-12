'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';

export interface TaskMetrics {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  disputed: number;
  successRate: number;
  avgLatencyMs: number;
}

export function useTaskMetrics(intervalMs = 15_000) {
  const [metrics, setMetrics] = useState<TaskMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async () => {
    try {
      const { data } = await api.get('/api/v1/tasks/metrics');
      setMetrics(data);
    } catch {
      /* silent — metrics are nice-to-have */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    timer.current = setInterval(fetch, intervalMs);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [fetch, intervalMs]);

  return { metrics, loading, refetch: fetch };
}
