"use client";

import { useState, useEffect, useCallback } from "react";
import {
  analyticsApi,
  type DashboardSnapshot,
  type CategoryBreakdown,
  type VolumePoint,
} from "@/lib/api";

/** Full analytics snapshot with 30s polling. */
export function useAnalytics(days = 7) {
  const [dashboard, setDashboard] = useState<DashboardSnapshot | null>(null);
  const [categories, setCategories] = useState<CategoryBreakdown | null>(null);
  const [volume, setVolume] = useState<VolumePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [d, c, v] = await Promise.all([
        analyticsApi.dashboard(),
        analyticsApi.categories(),
        analyticsApi.volume(days),
      ]);
      setDashboard(d);
      setCategories(c);
      setVolume([...v.series].reverse()); // oldest → newest for charts
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void fetchAll();
    const id = setInterval(() => void fetchAll(), 30_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  return { dashboard, categories, volume, loading, error, refresh: fetchAll };
}
