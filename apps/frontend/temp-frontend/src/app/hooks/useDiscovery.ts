'use client';
import { useState, useEffect, useCallback } from 'react';
import { discoveryApi, type DiscoveryQuery, type Service } from '@/lib/api';

export function useDiscovery(query: DiscoveryQuery = {}) {
  const [results, setResults] = useState<Service[]>([]);
  const [count,   setCount]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const discover = useCallback(async (q: DiscoveryQuery = query) => {
    setLoading(true);
    try {
      const res = await discoveryApi.discover(q);
      setResults(res.results);
      setCount(res.count);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(query)]);

  useEffect(() => { discover(); }, [discover]);

  return { results, count, loading, error, discover };
}
