'use client';

import { useState, useEffect } from 'react';

export interface Provider {
  id: string;
  address: string;
  reputation: number;
  totalTasks: number;
  uptime: number;
  category: string;
  services: string[];
  joinedAt: number;
  staked: string;
  status: 'active' | 'inactive';
}

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? '';
    fetch(`${base}/api/v1/providers`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Provider[]) => {
        setProviders(data);
        setError(null);
      })
      .catch(err => setError(err.message ?? 'Eroare la incarcare providers'))
      .finally(() => setLoading(false));
  }, []);

  return { providers, loading, error };
}
