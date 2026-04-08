'use client';
import { useState, useEffect, useCallback } from 'react';
import { servicesApi, type Service } from '@/lib/api';

export function useServices(category?: string, limit = 50) {
  const [data,    setData]    = useState<Service[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await servicesApi.list(category, limit);
      setData(res.data);
      setTotal(res.total);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [category, limit]);

  useEffect(() => { load(); }, [load]);

  return { data, total, loading, error, refetch: load };
}

export function useServiceDetail(id: string | null) {
  const [data,    setData]    = useState<Service | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    servicesApi.get(id)
      .then(r => { setData(r); setError(null); })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  return { data, loading, error };
}
