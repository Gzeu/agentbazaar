'use client';

import { useState, useMemo } from 'react';
import { MOCK_SERVICES } from '@/lib/mock-data';
import { ServiceCard } from './ServiceCard';
import type { ServiceCategory } from '@/lib/types';

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  'data-fetching':   'Data Fetching',
  'compute-offload': 'Compute',
  'wallet-actions':  'Wallet',
  'compliance':      'Compliance',
  'enrichment':      'Enrichment',
  'orchestration':   'Orchestration',
  'notifications':   'Notifications',
};

export function ServiceGrid() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<ServiceCategory | 'all'>('all');

  const filtered = useMemo(() => MOCK_SERVICES.filter(s => {
    const matchCat = cat === 'all' || s.category === cat;
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.tags.some(t => t.includes(q));
    return matchCat && matchSearch;
  }), [search, cat]);

  const cats: (ServiceCategory | 'all')[] = ['all', ...Object.keys(CATEGORY_LABELS) as ServiceCategory[]];

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input className="input flex-1" placeholder="Caută servicii, tags..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="flex gap-2 flex-wrap mb-6">
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)} className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
            cat === c ? 'bg-brand-500 border-brand-500 text-white' : 'bg-dark-surface2 border-dark-border text-dark-muted hover:border-brand-500/40'
          }`}>
            {c === 'all' ? 'Toate' : CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <p className="text-3xl mb-3">🤖</p>
          <p className="text-dark-muted">Niciun serviciu găsit.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(s => <ServiceCard key={s.id} service={s} />)}
        </div>
      )}
    </div>
  );
}
