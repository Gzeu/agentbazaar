'use client';

import { useState, useEffect, useCallback } from 'react';
import { analyticsApi } from '@/lib/api';
import type { AnalyticsDashboard, VolumePoint } from '@/lib/types';

const FALLBACK_DASHBOARD: AnalyticsDashboard = {
  timestamp: new Date().toISOString(),
  tasks:     { total: 0, completed: 0, failed: 0, running: 0, pending: 0, disputed: 0, completionRate: 0, avgLatencyMs: 0 },
  tvl:       { wei: '0', egld: '0.000000' },
  services:  { total: 0, active: 0 },
  reputation:{ totalProviders: 0, avgScore: 0, topScore: 0 },
};

export function useAnalytics(volumeDays = 7) {
  const [dashboard, setDashboard]   = useState<AnalyticsDashboard>(FALLBACK_DASHBOARD);
  const [volume, setVolume]         = useState<VolumePoint[]>([]);
  const [categories, setCategories] = useState<Record<string, { services: number; tasks: number }>>({});
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, vol, cats] = await Promise.all([
        analyticsApi.getDashboard(),
        analyticsApi.getVolume(volumeDays),
        analyticsApi.getCategories(),
      ]);
      if (dash)  setDashboard(dash);
      if (vol?.series)  setVolume(vol.series);
      if (cats?.categories) setCategories(cats.categories);
    } catch {
      setError('Backend offline — analytics unavailable');
    } finally {
      setLoading(false);
    }
  }, [volumeDays]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { dashboard, volume, categories, loading, error, refresh: fetchAll };
}
