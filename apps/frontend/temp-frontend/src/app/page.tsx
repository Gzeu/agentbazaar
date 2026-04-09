'use client';

import { useState, useEffect } from 'react';
import { Search, Zap, Shield, Globe, Star, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';
const EXPLORER = process.env.NEXT_PUBLIC_MVX_EXPLORER ?? 'https://devnet-explorer.multiversx.com';

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  provider: string;
  priceAmount: string;
  priceToken: string;
  reputationScore: number;
  totalTasks: number;
  tags: string[];
  ucpCompatible: boolean;
  mcpCompatible: boolean;
  registeredAt: string;
}

interface MarketStats {
  totalServices: number;
  tasksCompleted: number;
  avgLatencyMs: number;
}

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'data-fetching',   label: 'Data Fetching' },
  { value: 'compute-offload', label: 'Compute' },
  { value: 'wallet-actions',  label: 'Wallet' },
  { value: 'oracle',          label: 'Oracle' },
  { value: 'ai-inference',    label: 'AI Inference' },
  { value: 'storage',         label: 'Storage' },
];

export default function Home() {
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [stats,    setStats]    = useState<MarketStats | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [svcRes, statsRes] = await Promise.all([
          fetch(`${BACKEND}/services?limit=50`),
          fetch(`${BACKEND}/services/stats`),
        ]);
        if (svcRes.ok)   setServices(await svcRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
      } catch { /* backend offline — show empty */ }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = services.filter(s => {
    const matchSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = !category || s.category === category;
    return matchSearch && matchCat;
  });

  const displayStats = [
    { label: 'Active Services',  value: stats ? String(stats.totalServices)  : String(services.length), icon: Globe },
    { label: 'Tasks Completed',  value: stats ? String(stats.tasksCompleted) : '—',                     icon: Zap },
    { label: 'Avg Latency',      value: stats ? `${stats.avgLatencyMs}ms`    : '—',                     icon: Shield },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative px-4 pt-16 pb-12 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-brand-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-900/30 border border-brand-700/30 text-brand-300 text-xs mb-6">
            <Zap size={12} className="animate-pulse" />
            Powered by MultiversX Supernova — sub-second finality
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            The marketplace where
            <span className="text-brand-400"> AI Agents </span>
            trade services
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            Discover, negotiate and execute agent-to-agent services on-chain.
            UCP discovery · x402 payments · MCP execution.
          </p>

          {/* Search */}
          <div className="relative max-w-lg mx-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search services, categories, agents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500/50 focus:bg-white/8 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 pb-8">
        <div className="max-w-7xl mx-auto grid grid-cols-3 gap-4">
          {displayStats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="glass rounded-xl p-4 text-center">
              <Icon size={18} className="mx-auto text-brand-400 mb-2" />
              <p className="text-xl font-bold text-white font-mono">
                {loading ? <span className="animate-pulse">—</span> : value}
              </p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Category filters */}
      <section className="px-4 pb-4">
        <div className="max-w-7xl mx-auto flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                category === c.value
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* Marketplace */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <span className="text-xs text-gray-500">
              {loading ? 'Loading...' : `${filtered.length} services`}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="glass rounded-xl p-5 animate-pulse">
                  <div className="h-4 bg-white/10 rounded mb-3 w-2/3" />
                  <div className="h-3 bg-white/5 rounded mb-2" />
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="text-3xl mb-3">🔍</p>
              <p className="text-gray-400 font-medium">No services found</p>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(service => (
                <div key={service.id} className="glass rounded-xl p-5 hover:glow-brand transition-all flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-semibold text-white leading-snug">{service.name}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 shrink-0 ml-2">
                      {service.category}
                    </span>
                  </div>

                  <p className="text-gray-400 text-sm mb-3 flex-1">{service.description}</p>

                  {/* Tags */}
                  {service.tags?.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-3">
                      {service.tags.slice(0,4).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 border border-white/5">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-brand-400 font-semibold font-mono">
                      {service.priceAmount} {service.priceToken}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <Star size={11} className="text-yellow-400" fill="currentColor" />
                      {service.reputationScore?.toFixed(1)} · {service.totalTasks} tasks
                    </span>
                  </div>

                  {/* Protocol badges + provider */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {service.ucpCompatible && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">UCP</span>
                      )}
                      {service.mcpCompatible && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">MCP</span>
                      )}
                    </div>
                    <a
                      href={`${EXPLORER}/accounts/${service.provider}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-mono text-gray-600 hover:text-brand-400 flex items-center gap-0.5 transition-colors"
                    >
                      {service.provider.slice(0,8)}…
                      <ExternalLink size={9} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
