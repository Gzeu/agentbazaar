'use client';

import { useState } from 'react';
import { Search, Zap, Shield, Globe } from 'lucide-react';

const STATS = [
  { label: 'Active Services', value: '12', icon: Globe },
  { label: 'Tasks Completed', value: '247', icon: Zap },
  { label: 'Avg Latency', value: '<1s', icon: Shield },
];

const MOCK_SERVICES = [
  {
    id: '1',
    name: 'Data Fetch Pro',
    category: 'data-fetching',
    description: 'Fast API data fetching with caching',
    provider: '0x1234...5678',
    priceAmount: '0.1',
    priceToken: 'EGLD',
    reputationScore: 4.8,
    totalTasks: 156,
    tags: ['api', 'fast', 'cached'],
    ucpCompatible: true,
    mcpCompatible: false,
    registeredAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'AI Assistant',
    category: 'compute-offload',
    description: 'Advanced AI computation services',
    provider: '0xabcd...efgh',
    priceAmount: '0.5',
    priceToken: 'EGLD',
    reputationScore: 4.9,
    totalTasks: 89,
    tags: ['ai', 'ml', 'compute'],
    ucpCompatible: false,
    mcpCompatible: true,
    registeredAt: '2024-01-20T14:15:00Z'
  },
  {
    id: '3',
    name: 'Wallet Manager',
    category: 'wallet-actions',
    description: 'Secure wallet management and transactions',
    provider: '0x9876...5432',
    priceAmount: '0.05',
    priceToken: 'EGLD',
    reputationScore: 4.7,
    totalTasks: 234,
    tags: ['wallet', 'secure', 'transactions'],
    ucpCompatible: true,
    mcpCompatible: true,
    registeredAt: '2024-01-10T09:00:00Z'
  }
];

export default function Home() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const filtered = search
    ? MOCK_SERVICES.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.description.toLowerCase().includes(search.toLowerCase()),
      )
    : MOCK_SERVICES;

  return (
    <>
      {/* Hero */}
      <section className="relative px-4 pt-16 pb-12 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-brand-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-900/30 border border-brand-700/30 text-brand-300 text-xs mb-6">
            <Zap size={12} className="animate-pulse" />
            Powered by MultiversX Supernova - sub-second finality
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
            <span className="text-xs text-gray-500">{filtered.length} services</span>
          </div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="text-3xl mb-3">No services found</p>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((service) => (
                <div key={service.id} className="glass rounded-xl p-5 hover:glow-brand transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">
                      {service.category}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{service.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-brand-400 font-semibold">
                      {service.priceAmount} {service.priceToken}
                    </span>
                    <span className="text-gray-500">
                      {service.reputationScore} · {service.totalTasks} tasks
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {service.ucpCompatible && (
                      <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        UCP
                      </span>
                    )}
                    {service.mcpCompatible && (
                      <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                        MCP
                      </span>
                    )}
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
