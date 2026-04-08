'use client';
import { useState, useEffect, useCallback } from 'react';
import { reputationApi, type ReputationEntry } from '@/lib/api';

export function useReputationLeaderboard(limit = 20, pollMs = 10000) {
  const [data,    setData]    = useState<ReputationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await reputationApi.leaderboard(limit);
      setData(res);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    load();
    if (pollMs > 0) {
      const id = setInterval(load, pollMs);
      return () => clearInterval(id);
    }
  }, [load, pollMs]);

  return { data, loading, error, refetch: load };
}

export function useReputation(address: string | null) {
  const [data,    setData]    = useState<ReputationEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    reputationApi.get(address)
      .then(r => { setData(r); setError(null); })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [address]);

  return { data, loading, error };
}
