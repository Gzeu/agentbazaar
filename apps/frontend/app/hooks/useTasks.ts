'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { tasksApi } from '@/lib/api';
import type { Task, TaskStatus } from '@/lib/types';

export type TaskFilter = 'all' | TaskStatus;

export function useTasks(intervalMs = 6_000) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      // Try real API first; fall back to empty on error
      const result = await tasksApi.list?.() ?? [];
      setTasks(result?.tasks ?? result ?? []);
    } catch {
      /* keep previous data */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    timer.current = setInterval(fetchAll, intervalMs);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [fetchAll, intervalMs]);

  const filtered = tasks.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (serviceId && t.serviceId !== serviceId) return false;
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    running: tasks.filter(t => t.status === 'running').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
    disputed: tasks.filter(t => t.status === 'disputed').length,
    avgLatency: Math.round(
      tasks.filter(t => t.latencyMs).reduce((s, t) => s + (t.latencyMs ?? 0), 0) /
      Math.max(1, tasks.filter(t => t.latencyMs).length)
    ),
    successRate: tasks.length
      ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
      : 0,
  };

  const submitTask = useCallback(async (payload: {
    serviceId: string;
    consumerAddress: string;
    providerAddress: string;
    maxBudget: string;
    inputData?: Record<string, unknown>;
  }) => {
    setSubmitting(true);
    try {
      const result = await tasksApi.submit(payload);
      await fetchAll();
      return result;
    } finally {
      setSubmitting(false);
    }
  }, [fetchAll]);

  return { tasks: filtered, filter, setFilter, serviceId, setServiceId, stats, loading, submitting, submitTask, refetch: fetchAll };
}
