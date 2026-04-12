'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { servicesApi } from '@/lib/api';
import { MOCK_SERVICES } from '@/lib/mock-data';
import type { Service, ServiceCategory } from '@/lib/types';

export type SortKey = 'reputation' | 'price-asc' | 'price-desc' | 'tasks' | 'newest';

export function useServices() {
  const [allServices, setAllServices]   = useState<Service[]>(MOCK_SERVICES as Service[]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState('');
  const [category, setCategory]         = useState<ServiceCategory | 'all'>('all');
  const [sort, setSort]                 = useState<SortKey>('reputation');
  const [ucpOnly, setUcpOnly]           = useState(false);
  const [mcpOnly, setMcpOnly]           = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { services } = await servicesApi.list({ limit: 200 });
      if (services && services.length > 0) {
        setAllServices(services as Service[]);
      }
      // if backend returns empty, keep mock data
    } catch {
      // backend offline — fall back silently to mock data
      setError('Backend offline — showing demo data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const filtered = useMemo(() => {
    let result = [...allServices];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags?.some(t => t.toLowerCase().includes(q))
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
    services: filtered,
    total: allServices.length,
    loading,
    error,
    refresh: fetchServices,
    search,    setSearch,
    category,  setCategory,
    sort,      setSort,
    ucpOnly,   setUcpOnly,
    mcpOnly,   setMcpOnly,
  };
}
