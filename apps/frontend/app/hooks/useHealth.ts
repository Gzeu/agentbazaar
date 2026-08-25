'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';

export interface HealthData {
  status: string;
  mcp_tools_loaded: number;
  multiversx_reachable: boolean;
  uptime_seconds: number;
  version: string;
  nonce?: number;
}

export function useHealth(intervalMs = 30_000) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async () => {
    try {
      const { data } = await api.get('/health');
      setHealth(data);
      setError(null);
    } catch {
      setHealth(null);
      setError('unreachable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    timer.current = setInterval(fetch, intervalMs);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [fetch, intervalMs]);

  return { health, loading, error, refetch: fetch };
}
