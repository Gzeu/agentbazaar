'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { ReputationRecord } from '@/lib/types';

export function useLeaderboard(limit = 20) {
  const [data, setData] = useState<ReputationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      const { data: res } = await api.get('/api/v1/reputation/leaderboard', { params: { limit } });
      setData(res?.leaderboard ?? res ?? []);
      setError(null);
    } catch {
      setError('fetch_failed');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
