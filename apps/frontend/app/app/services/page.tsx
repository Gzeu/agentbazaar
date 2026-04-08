'use client';

import { useState, useMemo } from 'react';
import { MOCK_SERVICES } from '@/lib/mock-data';
import type { Service, ServiceCategory } from '@/lib/types';

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  'data-fetching': 'Data Fetching',
  'compute-offload': 'Compute Offload',
  'wallet-actions': 'Wallet Actions',
  'compliance': 'Compliance',
  'enrichment': 'Enrichment',
  'orchestration': 'Orchestration',
  'notifications': 'Notifications',
};

const CATEGORY_COLORS: Record<ServiceCategory, string> = {
  'data-fetching': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  'compute-offload': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'wallet-actions': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'compliance': 'bg-red-500/10 text-red-400 border-red-500/20',
  'enrichment': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'orchestration': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'notifications': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

function ReputationBar({ score }: { score: number }) {
  const pct = Math.round(score / 100);
  const color = pct >= 90 ? 'bg-emerald-400' : pct >= 70 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-dark-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-dark-muted w-10 text-right">{(score / 100).toFixed(1)}%</span>
    </div>
  );
}

function ServiceCard({ service, onBuy }: { service: Service; onBuy: (s: Service) => void }) {
  return (
    <div className="card flex flex-col gap-4 group cursor-pointer" onClick={() => onBuy(service)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-dark-text truncate group-hover:text-brand-400 transition-colors">{service.name}</h3>
          <p className="text-xs text-dark-muted mt-0.5 line-clamp-2">{service.description}</p>
        </div>
        <span className={`badge border flex-shrink-0 ${CATEGORY_COLORS[service.category]}`}>
          {CATEGORY_LABELS[service.category]}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-dark-muted">Preț</p>
          <p className="text-sm font-bold font-mono text-brand-400">{service.priceAmount} {service.priceToken}</p>
          <p className="text-[10px] text-dark-muted">{service.pricingModel}</p>
        </div>
        <div>
          <p className="text-xs text-dark-muted">Latență</p>
          <p className="text-sm font-bold font-mono text-dark-text">{service.maxLatencyMs}ms</p>
          <p className="text-[10px] text-dark-muted">max</p>
        </div>
        <div>
          <p className="text-xs text-dark-muted">Task-uri</p>
          <p className="text-sm font-bold font-mono text-dark-text">{(service.totalTasks / 1000).toFixed(1)}K</p>
          <p className="text-[10px] text-dark-muted">total</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-dark-muted">Reputație</span>
        </div>
        <ReputationBar score={service.reputationScore} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {service.ucpCompatible && (
          <span className="text-[10px] font-mono bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded px-1.5 py-0.5">UCP</span>
        )}
        {service.mcpCompatible && (
          <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded px-1.5 py-0.5">MCP</span>
        )}
        {service.tags.slice(0, 3).map(tag => (
          <span key={tag} className="text-[10px] text-dark-muted bg-dark-surface2 border border-dark-border rounded px-1.5 py-0.5">{tag}</span>
        ))}
      </div>

      <button
        className="btn-primary w-full justify-center mt-auto"
        onClick={e => { e.stopPropagation(); onBuy(service); }}
      >
        Cumpără Serviciu
      </button>
    </div>
  );
}

function CheckoutModal({ service, onClose }: { service: Service; onClose: () => void }) {
  const [step, setStep] = useState<'review' | 'mandate' | 'paying' | 'done'>('review');

  const handleNext = () => {
    if (step === 'review') setStep('mandate');
    else if (step === 'mandate') {
      setStep('paying');
      setTimeout(() => setStep('done'), 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-dark-border">
          <h2 className="font-semibold text-dark-text">Checkout — {service.name}</h2>
          <button onClick={onClose} className="btn-ghost p-1">✕</button>
        </div>

        <div className="p-5">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {['review', 'mandate', 'paying', 'done'].map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold border ${
                  step === s ? 'bg-brand-500 border-brand-500 text-white'
                  : ['review','mandate','paying','done'].indexOf(step) > i ? 'bg-brand-500/20 border-brand-500/40 text-brand-400'
                  : 'bg-dark-surface2 border-dark-border text-dark-muted'
                }`}>{i + 1}</div>
                {i < 3 && <div className="flex-1 h-px bg-dark-border" />}
              </div>
            ))}
          </div>

          {step === 'review' && (
            <div className="space-y-4">
              <div className="bg-dark-surface2 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-muted">Serviciu</span>
                  <span className="text-dark-text font-medium">{service.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-muted">Model preț</span>
                  <span className="text-dark-text font-mono">{service.pricingModel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-muted">Cost</span>
                  <span className="text-brand-400 font-bold font-mono">{service.priceAmount} {service.priceToken}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-muted">Latență max</span>
                  <span className="text-dark-text font-mono">{service.maxLatencyMs}ms</span>
                </div>
              </div>
              <button className="btn-primary w-full justify-center" onClick={handleNext}>Continuă cu AP2 →</button>
            </div>
          )}

          {step === 'mandate' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-xs text-amber-400 font-medium mb-1">⚡ AP2 Mandate Check</p>
                <p className="text-xs text-dark-muted">Autorizezi agentul să execute o singură tranzacție în limita bugetului stabilit.</p>
              </div>
              <div className="bg-dark-surface2 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-muted">Tip mandate</span>
                  <span className="text-dark-text">Single-use</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-muted">Limită buget</span>
                  <span className="text-brand-400 font-mono">{service.priceAmount} {service.priceToken}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-muted">Protocol</span>
                  <span className="text-dark-text font-mono">x402 + ACP</span>
                </div>
              </div>
              <button className="btn-primary w-full justify-center" onClick={handleNext}>Confirmă & Plătește</button>
            </div>
          )}

          {step === 'paying' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-12 h-12 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-dark-muted">Procesare pe Supernova...</p>
              <p className="text-xs text-dark-muted font-mono">sub-second finality</p>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
              <div>
                <p className="font-semibold text-dark-text">Task trimis cu succes!</p>
                <p className="text-xs text-dark-muted mt-1">Plata confirmată pe MultiversX Supernova</p>
              </div>
              <div className="bg-dark-surface2 rounded-lg p-3 w-full text-left space-y-1">
                <p className="text-xs text-dark-muted">Task ID: <span className="font-mono text-brand-400">task-{Math.random().toString(36).slice(2,10)}</span></p>
                <p className="text-xs text-dark-muted">Protocol: <span className="text-dark-text">x402 + MCP</span></p>
              </div>
              <button className="btn-primary w-full justify-center" onClick={onClose}>Închide</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'reputation' | 'latency' | 'price' | 'volume'>('reputation');
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const categories = ['all', ...Object.keys(CATEGORY_LABELS)] as const;

  const filtered = useMemo(() => {
    return MOCK_SERVICES
      .filter(s => {
        const matchCat = activeCategory === 'all' || s.category === activeCategory;
        const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()) || s.tags.some(t => t.includes(search.toLowerCase()));
        return matchCat && matchSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'reputation') return b.reputationScore - a.reputationScore;
        if (sortBy === 'latency') return a.maxLatencyMs - b.maxLatencyMs;
        if (sortBy === 'price') return parseFloat(a.priceAmount) - parseFloat(b.priceAmount);
        if (sortBy === 'volume') return b.totalTasks - a.totalTasks;
        return 0;
      });
  }, [search, activeCategory, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-text mb-1">Marketplace</h1>
        <p className="text-dark-muted text-sm">{MOCK_SERVICES.length} servicii disponibile • Discovery via UCP</p>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          className="input flex-1"
          placeholder="Caută servicii, tags, capabilități..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="input sm:w-48"
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
        >
          <option value="reputation">Sortare: Reputație</option>
          <option value="latency">Sortare: Latență</option>
          <option value="price">Sortare: Preț</option>
          <option value="volume">Sortare: Volum</option>
        </select>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap mb-8">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              activeCategory === cat
                ? 'bg-brand-500 border-brand-500 text-white'
                : 'bg-dark-surface2 border-dark-border text-dark-muted hover:border-brand-500/40 hover:text-dark-text'
            }`}
          >
            {cat === 'all' ? 'Toate' : CATEGORY_LABELS[cat as ServiceCategory]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-4xl mb-4">🤖</p>
          <p className="text-dark-muted">Niciun serviciu găsit pentru criteriile selectate.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(service => (
            <ServiceCard key={service.id} service={service} onBuy={setSelectedService} />
          ))}
        </div>
      )}

      {selectedService && (
        <CheckoutModal service={selectedService} onClose={() => setSelectedService(null)} />
      )}
    </div>
  );
}
