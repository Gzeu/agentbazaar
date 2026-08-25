"use client";

import { useState, useEffect, useCallback } from "react";
import { tasksApi, type TaskRecord, type TaskStatus } from "@/lib/api";

/**
 * Live task list from the orchestration API with polling + local overrides.
 * Local overrides apply optimistic dispute/refund/complete updates instantly.
 */
export function useMyTasks(opts: { limit?: number; status?: TaskStatus } = {}) {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, TaskRecord>>({});

  const fetchTasks = useCallback(async () => {
    try {
      setError(null);
      const res = await tasksApi.list({ limit: opts.limit ?? 50, status: opts.status });
      setTasks(res.data);
      setTotal(res.total);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [opts.limit, opts.status]);

  useEffect(() => {
    void fetchTasks();
    const id = setInterval(() => void fetchTasks(), 15_000);
    return () => clearInterval(id);
  }, [fetchTasks]);

  /** Optimistically apply an updated task (from dispute/refund/complete). */
  const applyUpdate = useCallback((updated: TaskRecord) => {
    setOverrides((prev) => ({ ...prev, [updated.id]: updated }));
  }, []);

  // Merge server data with local overrides
  const merged = tasks.map((t) => overrides[t.id] ?? t);

  return { tasks: merged, total, loading, error, refresh: fetchTasks, applyUpdate };
}
