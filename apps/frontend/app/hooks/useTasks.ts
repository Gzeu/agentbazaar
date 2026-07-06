'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { tasksApi } from '@/lib/api';
import type { Task, TaskStatus } from '@/lib/types';

export type TaskFilter = 'all' | TaskStatus;

const POLL_INTERVAL_MS = 15_000;

export function useTasks() {
  const [allTasks, setAllTasks]     = useState<Task[]>([]);
  const [total, setTotal]           = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [filter, setFilter]         = useState<TaskFilter>('all');
  const [serviceId, setServiceId]   = useState<string | null>(null);

  const fetchTasks = useCallback(async (cursor?: string) => {
    try {
      setError(null);
      const res = await tasksApi.list({
        limit: 50,
        status: filter !== 'all' ? filter : undefined,
        after: cursor,
      });
      if (cursor) {
        setAllTasks(prev => [...prev, ...res.data]);
      } else {
        setAllTasks(res.data);
      }
      setTotal(res.total);
      setNextCursor(res.nextCursor);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    setAllTasks([]);
    void fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const id = setInterval(() => void fetchTasks(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchTasks]);

  const tasks = useMemo(() => {
    let result = [...allTasks];
    if (serviceId) result = result.filter(t => t.serviceId === serviceId);
    return result;
  }, [allTasks, serviceId]);

  const stats = useMemo(() => ({
    total,
    pending:   allTasks.filter(t => t.status === 'pending').length,
    running:   allTasks.filter(t => t.status === 'running').length,
    completed: allTasks.filter(t => t.status === 'completed').length,
    failed:    allTasks.filter(t => t.status === 'failed').length,
    disputed:  allTasks.filter(t => t.status === 'disputed').length,
    refunded:  allTasks.filter(t => t.status === 'refunded').length,
    avgLatency: (() => {
      const withLatency = allTasks.filter(t => t.latencyMs);
      if (!withLatency.length) return 0;
      return Math.round(
        withLatency.reduce((s, t) => s + (t.latencyMs ?? 0), 0) / withLatency.length
      );
    })(),
  }), [allTasks, total]);

  const loadMore = useCallback(() => {
    if (nextCursor) void fetchTasks(nextCursor);
  }, [nextCursor, fetchTasks]);

  const refresh = useCallback(() => {
    setAllTasks([]);
    setLoading(true);
    void fetchTasks();
  }, [fetchTasks]);

  return {
    tasks, stats, total, loading, error,
    filter, setFilter,
    serviceId, setServiceId,
    loadMore, hasMore: Boolean(nextCursor),
    refresh,
  };
}
