'use client';

import { useState, useEffect, useCallback } from 'react';
import { reputationApi } from '@/lib/api';
import type { ReputationRecord } from '@/lib/types';

export function useReputation(address: string | null) {
  const [data, setData] = useState<ReputationRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const result = await reputationApi.get(address);
      setData(result);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'fetch_failed');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
