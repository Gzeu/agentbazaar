'use client';

import Link from 'next/link';
import { useServices } from '@/hooks/useServices';
import type { Service, ServiceCategory } from '@/lib/types';

const CATEGORIES: { value: ServiceCategory | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'Toate', emoji: '🌐' },
  { value: 'data-fetching', label: 'Data', emoji: '📡' },
  { value: 'compute-offload', label: 'Compute', emoji: '🧠' },
  { value: 'orchestration', label: 'Orchestration', emoji: '🔗' },
  { value: 'enrichment', label: 'Enrichment', emoji: '✨' },
  { value: 'compliance', label: 'Compliance', emoji: '🛡️' },
  { value: 'wallet-actions', label: 'Wallet', emoji: '💼' },
];

const CATEGORY_COLORS: Record<string, string> = {
  'data-fetching': 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  'compute-offload': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  'compliance': 'text-red-400 bg-red-500/10 border-red-500/20',
  'orchestration': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'enrichment': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'wallet-actions': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'notifications': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

function ServiceCard({ s }: { s: Service }) {
  const repPct = (s.reputationScore / 100).toFixed(1);
  const repColor = s.reputationScore >= 9500 ? 'text-emerald-400' : s.reputationScore >= 8500 ? 'text-brand-400' : 'text-amber-400';

  return (
    <Link href={`/services/${s.id}`} className="card flex flex-col gap-3 group hover:border-brand-500/40 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-200">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <span className={`badge border text-xs ${CATEGORY_COLORS[s.category] ?? 'text-dark-muted bg-dark-surface2 border-dark-border'}`}>
          {s.category}
        </span>
        <span className={`text-xs font-bold font-mono ${repColor}`}>{repPct}%</span>
      </div>

      {/* Name + desc */}
      <div>
        <h3 className="font-semibold text-dark-text group-hover:text-brand-400 transition-colors line-clamp-1">{s.name}</h3>
        <p className="text-xs text-dark-muted mt-1 line-clamp-2 leading-relaxed">{s.description}</p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {s.tags.slice(0, 3).map(t => (
          <span key={t} className="text-xs font-mono text-dark-muted bg-dark-surface2 border border-dark-border rounded px-1.5 py-0.5">{t}</span>
        ))}
      </div>

      {/* Bottom stats */}
      <div className="flex items-center justify-between pt-2 border-t border-dark-border">
        <div className="flex items-center gap-3">
          {s.ucpCompatible && <span className="text-xs font-mono text-brand-400">UCP</span>}
          {s.mcpCompatible && <span className="text-xs font-mono text-purple-400">MCP</span>}
          <span className="text-xs text-dark-muted">{(s.totalTasks / 1000).toFixed(1)}K tasks</span>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold font-mono text-dark-text">{s.priceAmount} EGLD</p>
          <p className="text-xs text-dark-muted">{s.pricingModel.replace('per-', '/')}</p>
        </div>
      </div>
    </Link>
  );
}

export default function MarketplacePage() {
  const { services, search, setSearch, category, setCategory, sort, setSort, ucpOnly, setUcpOnly, mcpOnly, setMcpOnly, total } = useServices();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-500/20 bg-gradient-to-br from-brand-900/30 via-dark-surface to-dark-bg mb-8 p-6 sm:p-10">
        <div className="relative z-10">
          <p className="text-xs font-mono text-brand-400 mb-2 uppercase tracking-widest">MultiversX Supernova</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Piața AI Agent<br className="hidden sm:block" />
            <span className="text-brand-400"> on-chain</span>
          </h1>
          <p className="text-dark-muted max-w-lg text-sm sm:text-base">Descoperă servicii, plătești cu x402, execuți prin MCP — totul în sub-secundă pe Supernova.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {['UCP Discovery', 'ACP Checkout', 'AP2 Mandate', 'x402 Payment', 'MCP Execution'].map(p => (
              <span key={p} className="text-xs font-mono text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded-full px-3 py-1">{p}</span>
            ))}
          </div>
        </div>
        {/* Decorative */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          className="input flex-1"
          placeholder="Caută servicii, taguri, descrieri..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input sm:w-40" value={sort} onChange={e => setSort(e.target.value as any)}>
          <option value="reputation">Reputație ↓</option>
          <option value="price-asc">Preț ↑</option>
          <option value="price-desc">Preț ↓</option>
          <option value="tasks">Task-uri ↓</option>
          <option value="newest">Noi</option>
        </select>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors border ${
              category === c.value
                ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                : 'bg-dark-surface2 text-dark-muted border-dark-border hover:text-dark-text'
            }`}
          >
            <span className="text-xs">{c.emoji}</span>
            {c.label}
          </button>
        ))}
        <button
          onClick={() => setUcpOnly(!ucpOnly)}
          className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-colors border ${
            ucpOnly ? 'bg-brand-500/20 text-brand-300 border-brand-500/40' : 'bg-dark-surface2 text-dark-muted border-dark-border'
          }`}
        >UCP only</button>
        <button
          onClick={() => setMcpOnly(!mcpOnly)}
          className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-colors border ${
            mcpOnly ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-dark-surface2 text-dark-muted border-dark-border'
          }`}
        >MCP only</button>
      </div>

      {/* Results count */}
      <p className="text-xs text-dark-muted mb-4">
        {services.length} din {total} servicii
      </p>

      {/* Grid */}
      {services.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-dark-muted">
          <span className="text-4xl">🤖</span>
          <p className="text-sm">Niciun serviciu găsit. Încearcă alt filtru.</p>
          <button className="btn-secondary" onClick={() => { setSearch(''); setCategory('all'); }}>Resetează filtrele</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(s => <ServiceCard key={s.id} s={s} />)}
        </div>
      )}
    </div>
  );
}
