"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  servicesApi,
  tasksApi,
  reputationApi,
  type ServiceRecord,
  type TaskRecord,
  type ReputationEntry,
} from "@/lib/api";

/**
 * Provider dashboard data — my services + incoming task history + reputation.
 * Falls back to empty data with error surfaced on API failure.
 */
export function useProviderDashboard(providerAddress: string | null) {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [reputation, setReputation] = useState<ReputationEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!providerAddress) return;
    try {
      setError(null);
      const [svc, tsk] = await Promise.all([
        servicesApi.list({ limit: 100 }),
        tasksApi.list({ limit: 100 }),
      ]);
      const mine = svc.data.filter(
        (s) => s.providerAddress?.toLowerCase() === providerAddress.toLowerCase(),
      );
      setServices(mine);
      // Incoming tasks addressed to me as provider
      const serviceIds = new Set(mine.map((s) => s.id));
      setTasks(tsk.data.filter((t) => serviceIds.has(t.serviceId)));
      try {
        setReputation(await reputationApi.forAgent(providerAddress));
      } catch {
        setReputation(null); // no reputation record yet
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [providerAddress]);

  useEffect(() => {
    void fetchAll();
    const id = setInterval(() => void fetchAll(), 20_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "completed");
    const earned = completed.reduce(
      (s, t) => s + Number(t.maxBudget ?? 0) / 1e18,
      0,
    );
    return {
      activeServices: services.filter((s) => s.active).length,
      totalTasks: tasks.length,
      earnedEgld: earned.toFixed(4),
      avgScore: reputation ? Math.round(reputation.compositeScore) : null,
    };
  }, [services, tasks, reputation]);

  return { services, tasks, reputation, stats, loading, error, refresh: fetchAll };
}
