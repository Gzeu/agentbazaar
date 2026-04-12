import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface ReputationEntry {
  address: string;
  score: number;
  totalTasks: number;
  successRate: number;
  avgLatencyMs: number;
  onChain: boolean;
}

export function useLeaderboard(limit = 10) {
  const [data, setData] = useState<ReputationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/reputation/leaderboard?limit=${limit}`)
      .then(r => r.json())
      .then(j => { setData(j.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [limit]);

  return { data, loading };
}

export function useReputation(address: string) {
  const [data, setData] = useState<ReputationEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    fetch(`${API}/reputation/${address}`)
      .then(r => r.json())
      .then(j => { setData(j); setLoading(false); })
      .catch(() => setLoading(false));
  }, [address]);

  return { data, loading };
}
