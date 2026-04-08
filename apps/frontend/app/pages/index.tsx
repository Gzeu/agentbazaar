import { useState } from 'react';
import Head from 'next/head';
import { Search, Zap, Shield, Globe } from 'lucide-react';
import { ServiceGrid } from '@/components/services/ServiceGrid';
import { CategoryFilter } from '@/components/services/CategoryFilter';
import { useServices } from '@/hooks/useServices';

const STATS = [
  { label: 'Active Services', value: '—', icon: Globe },
  { label: 'Tasks Completed', value: '—', icon: Zap },
  { label: 'Avg Latency', value: '<1s', icon: Shield },
];

export default function MarketplacePage() {
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  const { services, total, loading } = useServices(
    category ? { category } : undefined,
  );

  const filtered = search
    ? services.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : services;

  return (
    <>
      <Head>
        <title>AgentBazaar — AI Agent Marketplace on MultiversX</title>
      </Head>

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
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500/50 focus:bg-white/8 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 pb-8">
        <div className="max-w-7xl mx-auto grid grid-cols-3 gap-4">
          {STATS.map(({ label, value, icon: Icon }) => (
            <div key={label} className="glass rounded-xl p-4 text-center">
              <Icon size={18} className="mx-auto text-brand-400 mb-2" />
              <p className="text-xl font-bold text-white font-mono">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Marketplace */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <CategoryFilter selected={category} onChange={setCategory} />
            <span className="text-xs text-gray-500">{total} services</span>
          </div>
          <ServiceGrid services={filtered} loading={loading} />
        </div>
      </section>
    </>
  );
}
