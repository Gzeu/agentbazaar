'use client';

import { useState, useEffect, useCallback } from 'react';
import { reputationApi } from '@/lib/api';
import type { ReputationRecord } from '@/lib/types';

/**
 * Hook for the global reputation leaderboard.
 * Polls every 60s.
 */
export function useReputationLeaderboard(limit = 10) {
  const [leaderboard, setLeaderboard] = useState<ReputationRecord[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setError(null);
      const data = await reputationApi.leaderboard(limit);
      setLeaderboard(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { void fetchLeaderboard(); }, [fetchLeaderboard]);
  useEffect(() => {
    const id = setInterval(() => void fetchLeaderboard(), 60_000);
    return () => clearInterval(id);
  }, [fetchLeaderboard]);

  return { leaderboard, loading, error, refresh: fetchLeaderboard };
}

/**
 * Hook for a single agent's reputation.
 * Pass address as undefined/null to skip fetching.
 */
export function useAgentReputation(address: string | null | undefined) {
  const [reputation, setReputation] = useState<ReputationRecord | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const fetchReputation = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      setError(null);
      const data = await reputationApi.get(address);
      setReputation(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { void fetchReputation(); }, [fetchReputation]);

  return { reputation, loading, error, refresh: fetchReputation };
}
