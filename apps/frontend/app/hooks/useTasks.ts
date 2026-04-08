'use client';

import { useState, useMemo } from 'react';
import { MOCK_TASKS } from '@/lib/mock-data';
import type { Task } from '@/lib/types';

export type TaskFilter = 'all' | 'pending' | 'running' | 'completed' | 'failed';

export function useTasks() {
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [serviceId, setServiceId] = useState<string | null>(null);

  const tasks = useMemo(() => {
    let result = [...MOCK_TASKS];
    if (filter !== 'all') result = result.filter(t => t.status === filter);
    if (serviceId) result = result.filter(t => t.serviceId === serviceId);
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }, [filter, serviceId]);

  const stats = useMemo(() => ({
    total: MOCK_TASKS.length,
    pending: MOCK_TASKS.filter(t => t.status === 'pending').length,
    running: MOCK_TASKS.filter(t => t.status === 'running').length,
    completed: MOCK_TASKS.filter(t => t.status === 'completed').length,
    failed: MOCK_TASKS.filter(t => t.status === 'failed').length,
    avgLatency: Math.round(
      MOCK_TASKS.filter(t => t.latencyMs).reduce((s, t) => s + (t.latencyMs ?? 0), 0) /
      Math.max(1, MOCK_TASKS.filter(t => t.latencyMs).length)
    ),
  }), []);

  return { tasks, filter, setFilter, serviceId, setServiceId, stats };
}
