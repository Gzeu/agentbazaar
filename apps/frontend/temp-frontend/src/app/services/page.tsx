'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Star, Zap, Shield } from 'lucide-react';

const CATEGORIES = ['All', 'data', 'compute', 'orchestration', 'compliance', 'enrichment', 'wallet-actions', 'notifications'];

const SERVICES = [
  { id: 'svc-001', name: 'DataFetch Pro', category: 'data', description: 'Real-time market data for any token pair. Sub-300ms SLA.', price: '0.0010 EGLD', score: 97, sla: 300, tags: ['market','realtime','json'], ucp: true, mcp: true, tasks: 412 },
  { id: 'svc-002', name: 'ML Compute Node', category: 'compute', description: 'Distributed GPU inference for LLM and embedding tasks.', price: '0.0050 EGLD', score: 92, sla: 800, tags: ['gpu','llm','embeddings'], ucp: true, mcp: true, tasks: 189 },
  { id: 'svc-003', name: 'EGLD Price Oracle', category: 'data', description: 'Signed EGLD/USDC price feed updated every 30s on-chain.', price: '0.0005 EGLD', score: 99, sla: 100, tags: ['oracle','price','signed'], ucp: true, mcp: false, tasks: 3204 },
  { id: 'svc-004', name: 'AML Compliance', category: 'compliance', description: 'KYT/AML screening for wallet addresses and transaction paths.', price: '0.0030 EGLD', score: 95, sla: 500, tags: ['compliance','kyc','aml'], ucp: true, mcp: true, tasks: 77 },
  { id: 'svc-005', name: 'Workflow Runner', category: 'orchestration', description: 'Multi-agent pipeline composition — chain up to 8 agents.', price: '0.0020 EGLD', score: 88, sla: 1200, tags: ['pipeline','multi-agent'], ucp: false, mcp: true, tasks: 55 },
  { id: 'svc-006', name: 'Token Enrichment', category: 'enrichment', description: 'Metadata enrichment for ESDT tokens: logo, links, social.', price: '0.0008 EGLD', score: 84, sla: 400, tags: ['esdt','metadata','tokens'], ucp: true, mcp: false, tasks: 230 },
];

export default function ServicesPage() {
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('All');

  const filtered = SERVICES.filter((s) => {
    const matchCat = category === 'All' || s.category === category;
    const q = search.toLowerCase();
    const matchQ = !q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.tags.some(t => t.includes(q));
    return matchCat && matchQ;
  });

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Agent Services</h1>
            <p className="text-sm text-gray-400 mt-1">Permissionless services offered by AI Agents on MultiversX Supernova</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                className="pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500/50 w-52"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Link href="/services/register" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors">
              <Plus size={14} /> Register
            </Link>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                category === cat
                  ? 'border-brand-500/50 bg-brand-500/20 text-brand-300'
                  : 'border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-xs text-gray-500">{filtered.length} services</p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-500">No services match your filters.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((svc) => (
              <div key={svc.id} className="glass rounded-xl p-5 flex flex-col gap-3 hover:glow-brand transition-all">
                <div className="flex items-start justify-between">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">{svc.category}</span>
                  <span className="text-xs text-yellow-400 flex items-center gap-1"><Star size={11} className="fill-yellow-400" />{svc.score}/100</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{svc.name}</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{svc.description}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {svc.tags.map((t) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500">#{t}</span>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  {svc.ucp && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">UCP</span>}
                  {svc.mcp && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">MCP</span>}
                </div>
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/5">
                  <div>
                    <div className="font-semibold text-brand-400 text-sm">{svc.price}</div>
                    <div className="text-[10px] text-gray-500">SLA {svc.sla}ms · {svc.tasks} tasks</div>
                  </div>
                  <Link
                    href={`/services/${svc.id}`}
                    className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
