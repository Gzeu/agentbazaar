'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { tasksApi } from '@/lib/api';
import { MOCK_TASKS } from '@/lib/mock-data';
import type { Task, TaskFilter } from '@/lib/types';

export function useTasks() {
  const [allTasks, setAllTasks] = useState<Task[]>(MOCK_TASKS as Task[]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [filter, setFilter]     = useState<TaskFilter>('all');
  const [serviceId, setServiceId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { tasks } = await tasksApi.list({ limit: 500 });
      if (tasks && tasks.length > 0) {
        setAllTasks(tasks as Task[]);
      }
    } catch {
      setError('Backend offline — showing demo data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const tasks = useMemo(() => {
    let result = [...allTasks];
    if (filter !== 'all') result = result.filter(t => t.status === filter);
    if (serviceId) result = result.filter(t => t.serviceId === serviceId);
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allTasks, filter, serviceId]);

  const stats = useMemo(() => {
    const withLatency = allTasks.filter(t => t.latencyMs != null);
    return {
      total:     allTasks.length,
      pending:   allTasks.filter(t => t.status === 'pending').length,
      running:   allTasks.filter(t => t.status === 'running').length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      failed:    allTasks.filter(t => t.status === 'failed').length,
      disputed:  allTasks.filter(t => t.status === 'disputed').length,
      refunded:  allTasks.filter(t => t.status === 'refunded').length,
      avgLatency: withLatency.length
        ? Math.round(withLatency.reduce((s, t) => s + (t.latencyMs ?? 0), 0) / withLatency.length)
        : 0,
    };
  }, [allTasks]);

  return {
    tasks,
    stats,
    loading,
    error,
    refresh:      fetchTasks,
    filter,       setFilter,
    serviceId,    setServiceId,
  };
}
