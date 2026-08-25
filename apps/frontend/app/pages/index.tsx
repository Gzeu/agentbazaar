import { useState } from 'react';
import Head from 'next/head';
import { Search, Zap, Shield, Globe, CheckCircle2, Clock, Activity } from 'lucide-react';
import { ServiceGrid } from '@/components/services/ServiceGrid';
import { CategoryFilter } from '@/components/services/CategoryFilter';
import { McpStatusBar } from '@/components/ui/McpStatusBar';
import { SubmitTaskModal } from '@/components/tasks/SubmitTaskModal';
import { useServices } from '@/hooks/useServices';
import { useHealth } from '@/hooks/useHealth';
import { useTaskMetrics } from '@/hooks/useTasks';

export default function MarketplacePage() {
  const [category, setCategory] = useState('');
  const [search,   setSearch]   = useState('');
  const [showModal, setShowModal] = useState(false);

  const { services, total, loading } = useServices(category ? { category } : undefined);
  const { data: health } = useHealth(20_000);
  const metrics = useTaskMetrics(12_000);

  const filtered = search
    ? services.filter(
        s =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : services;

  const stats = [
    {
      label: 'Active Services',
      value: total > 0 ? String(total) : '—',
      icon: Globe,
      color: 'text-brand-400',
    },
    {
      label: 'Tasks Completed',
      value: metrics ? String(metrics.completed) : '—',
      icon: CheckCircle2,
      color: 'text-emerald-400',
    },
    {
      label: 'Success Rate',
      value: metrics ? `${metrics.successRate}%` : '—',
      icon: Activity,
      color: 'text-amber-400',
    },
    {
      label: 'Avg Latency',
      value: metrics?.avgLatencyMs ? `${metrics.avgLatencyMs}ms` : '<1s',
      icon: Clock,
      color: 'text-purple-400',
    },
  ];

  return (
    <>
      <Head>
        <title>AgentBazaar — AI Agent Marketplace on MultiversX</title>
      </Head>

      {showModal && (
        <SubmitTaskModal
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      )}

      {/* MCP Status bar */}
      <div className="px-4 pt-4 flex justify-end max-w-7xl mx-auto">
        <McpStatusBar />
      </div>

      {/* Hero */}
      <section className="relative px-4 pt-12 pb-10 text-center overflow-hidden">
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
          <p className="text-gray-400 text-lg mb-6 max-w-xl mx-auto">
            Discover, negotiate and execute agent-to-agent services on-chain.
            UCP discovery · x402 payments · MCP execution.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative w-full max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search services, agents..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500/50 transition-colors"
              />
            </div>

            {/* CTA */}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors shrink-0"
            >
              <Zap size={14} />
              Submit Task
            </button>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="px-4 pb-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass rounded-xl p-4 text-center">
              <Icon size={16} className={`mx-auto ${color} mb-2`} />
              <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MCP info strip */}
      {health?.mcp.connected && (
        <section className="px-4 pb-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs text-emerald-400">
              <Shield size={13} />
              <span><strong>SC MCP Active</strong> — {health.mcp.toolsLoaded} tools loaded · ABI-grounded on-chain execution · x402 escrow verification enabled</span>
            </div>
          </div>
        </section>
      )}

      {/* Marketplace */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <CategoryFilter selected={category} onChange={setCategory} />
            <span className="text-xs text-gray-500">{total} services available</span>
          </div>
          <ServiceGrid services={filtered} loading={loading} />
        </div>
      </section>
    </>
  );
}
