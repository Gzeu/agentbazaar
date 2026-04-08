'use client';

import { useState, useMemo } from 'react';
import { MOCK_SERVICES } from '@/lib/mock-data';
import type { Service, ServiceCategory } from '@/lib/types';

export type SortKey = 'reputation' | 'price-asc' | 'price-desc' | 'tasks' | 'newest';

export function useServices() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ServiceCategory | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('reputation');
  const [ucpOnly, setUcpOnly] = useState(false);
  const [mcpOnly, setMcpOnly] = useState(false);

  const filtered = useMemo(() => {
    let result = [...MOCK_SERVICES];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.includes(q))
      );
    }

    if (category !== 'all') {
      result = result.filter(s => s.category === category);
    }

    if (ucpOnly) result = result.filter(s => s.ucpCompatible);
    if (mcpOnly) result = result.filter(s => s.mcpCompatible);

    switch (sort) {
      case 'reputation':  result.sort((a, b) => b.reputationScore - a.reputationScore); break;
      case 'price-asc':   result.sort((a, b) => parseFloat(a.priceAmount) - parseFloat(b.priceAmount)); break;
      case 'price-desc':  result.sort((a, b) => parseFloat(b.priceAmount) - parseFloat(a.priceAmount)); break;
      case 'tasks':       result.sort((a, b) => b.totalTasks - a.totalTasks); break;
      case 'newest':      result.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()); break;
    }

    return result;
  }, [search, category, sort, ucpOnly, mcpOnly]);

  return { services: filtered, search, setSearch, category, setCategory, sort, setSort, ucpOnly, setUcpOnly, mcpOnly, setMcpOnly, total: MOCK_SERVICES.length };
}
