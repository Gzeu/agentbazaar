'use client';

import { useState } from 'react';
import { Filter } from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'data-fetching', label: 'Data Fetching' },
  { value: 'compute-offload', label: 'Compute Offload' },
  { value: 'wallet-actions', label: 'Wallet Actions' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'enrichment', label: 'Enrichment' },
  { value: 'orchestration', label: 'Orchestration' },
  { value: 'notifications', label: 'Notifications' },
];

export function ServiceFilters({ onChange }: { onChange: (f: Record<string, unknown>) => void }) {
  const [category, setCategory] = useState('');
  const [minRep, setMinRep] = useState('');
  const [mcpOnly, setMcpOnly] = useState(false);

  const apply = (overrides: Record<string, unknown> = {}) => {
    onChange({
      ...(category && { category }),
      ...(minRep && { minReputation: Number(minRep) }),
      ...(mcpOnly && { mcpCompatible: true }),
      ...overrides,
    });
  };

  return (
    <div className="bg-dark-surface border border-dark-border rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-dark-text">
        <Filter size={14} className="text-brand-400" />
        Filters
      </div>

      <div>
        <label className="label">Category</label>
        <select
          className="input"
          value={category}
          onChange={(e) => { setCategory(e.target.value); apply({ category: e.target.value }); }}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Min Reputation (%)</label>
        <input
          type="number"
          className="input"
          min={0}
          max={100}
          placeholder="e.g. 80"
          value={minRep}
          onChange={(e) => setMinRep(e.target.value)}
          onBlur={() => apply()}
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="accent-brand-500"
          checked={mcpOnly}
          onChange={(e) => { setMcpOnly(e.target.checked); apply({ mcpCompatible: e.target.checked || undefined }); }}
        />
        <span className="text-sm text-dark-muted">MCP Compatible only</span>
      </label>

      <button className="btn-secondary w-full text-xs" onClick={() => { setCategory(''); setMinRep(''); setMcpOnly(false); onChange({}); }}>
        Reset Filters
      </button>
    </div>
  );
}
