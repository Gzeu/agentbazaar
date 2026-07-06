'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { servicesApi } from '@/lib/api';
import type { Service, ServiceCategory } from '@/lib/types';

export type SortKey = 'reputation' | 'price-asc' | 'price-desc' | 'tasks' | 'newest';

const POLL_INTERVAL_MS = 30_000;

export function useServices() {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState<ServiceCategory | 'all'>('all');
  const [sort, setSort]         = useState<SortKey>('reputation');
  const [ucpOnly, setUcpOnly]   = useState(false);
  const [mcpOnly, setMcpOnly]   = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      setError(null);
      const res = await servicesApi.list({ limit: 100, active: true });
      setAllServices(res.data);
      setTotal(res.total);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchServices(); }, [fetchServices]);

  useEffect(() => {
    const id = setInterval(() => void fetchServices(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchServices]);

  const filtered = useMemo(() => {
    let result = [...allServices];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.includes(q))
      );
    }
    if (category !== 'all') result = result.filter(s => s.category === category);
    if (ucpOnly) result = result.filter(s => s.ucpCompatible);
    if (mcpOnly) result = result.filter(s => s.mcpCompatible);
    switch (sort) {
      case 'reputation': result.sort((a, b) => b.reputationScore - a.reputationScore); break;
      case 'price-asc':  result.sort((a, b) => parseFloat(a.priceAmount) - parseFloat(b.priceAmount)); break;
      case 'price-desc': result.sort((a, b) => parseFloat(b.priceAmount) - parseFloat(a.priceAmount)); break;
      case 'tasks':      result.sort((a, b) => b.totalTasks - a.totalTasks); break;
      case 'newest':     result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
    }
    return result;
  }, [allServices, search, category, sort, ucpOnly, mcpOnly]);

  return {
    services: filtered, total, loading, error,
    search, setSearch,
    category, setCategory,
    sort, setSort,
    ucpOnly, setUcpOnly,
    mcpOnly, setMcpOnly,
    refresh: fetchServices,
  };
}
