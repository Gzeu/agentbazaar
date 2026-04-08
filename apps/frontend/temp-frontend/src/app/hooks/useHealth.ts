'use client';
import { useState, useEffect } from 'react';
import { healthApi, type HealthStatus } from '@/lib/api';

export function useHealth(pollMs = 15000) {
  const [data,    setData]    = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await healthApi.get();
        setData(res);
        setError(null);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    load();
    const id = setInterval(load, pollMs);
    return () => clearInterval(id);
  }, [pollMs]);

  return { data, loading, error };
}
