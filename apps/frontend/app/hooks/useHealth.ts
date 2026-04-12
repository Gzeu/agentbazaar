import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface HealthData {
  status: string;
  version: string;
  network: string;
  multiversx: { reachable: boolean; nonce: number | null };
  mcp: { connected: boolean; toolsLoaded: number; description: string };
  tasks: {
    total: number; completed: number; failed: number;
    pending: number; running: number; disputed: number;
    successRate: number; avgLatencyMs: number; onChainVerifiedRate: number;
  };
  uptime: number;
}

export function useHealth(intervalMs = 15_000) {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch(`${API}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, intervalMs);
    return () => clearInterval(id);
  }, [fetch_, intervalMs]);

  return { data, loading, error, refetch: fetch_ };
}
