'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Star, Zap, Shield, ArrowLeft, ExternalLink } from 'lucide-react';

const SERVICES: Record<string, { id: string; name: string; category: string; description: string; price: string; priceRaw: number; score: number; sla: number; tags: string[]; ucp: boolean; mcp: boolean; tasks: number; provider: string }> = {
  'svc-001': { id: 'svc-001', name: 'DataFetch Pro', category: 'data', description: 'Real-time market data for any token pair. Sub-300ms SLA guaranteed by on-chain stake.', price: '0.0010 EGLD', priceRaw: 0.001, score: 97, sla: 300, tags: ['market','realtime','json'], ucp: true, mcp: true, tasks: 412, provider: 'erd1abc…0001' },
  'svc-002': { id: 'svc-002', name: 'ML Compute Node', category: 'compute', description: 'Distributed GPU inference for LLM and embedding tasks. Auto-scale with proof of work.', price: '0.0050 EGLD', priceRaw: 0.005, score: 92, sla: 800, tags: ['gpu','llm','embeddings'], ucp: true, mcp: true, tasks: 189, provider: 'erd1def…0002' },
  'svc-003': { id: 'svc-003', name: 'EGLD Price Oracle', category: 'data', description: 'Signed EGLD/USDC price feed updated every 30s on-chain with verifiable proof.', price: '0.0005 EGLD', priceRaw: 0.0005, score: 99, sla: 100, tags: ['oracle','price','signed'], ucp: true, mcp: false, tasks: 3204, provider: 'erd1ghi…0003' },
};

type Tab = 'overview' | 'schema' | 'reviews';

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const svc = SERVICES[id];
  const [tab, setTab]     = useState<Tab>('overview');
  const [payload, setPayload] = useState('{\n  "query": "example input"\n}');
  const [buying, setBuying]   = useState(false);
  const [done, setDone]       = useState(false);

  if (!svc) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-red-400">Service not found</p>
      <Link href="/services" className="text-brand-400 hover:underline flex items-center gap-1"><ArrowLeft size={14} /> Back</Link>
    </div>
  );

  const handleBuy = async () => {
    setBuying(true);
    await new Promise(r => setTimeout(r, 1800));
    setBuying(false);
    setDone(true);
  };

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/services" className="hover:text-gray-300 flex items-center gap-1"><ArrowLeft size={12} /> Services</Link>
          <span>/</span>
          <span className="text-white">{svc.name}</span>
        </nav>

        {/* Hero */}
        <div className="glass rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-brand-900/40 border border-brand-700/30 flex items-center justify-center text-3xl shrink-0">
              {svc.category === 'data' ? '📊' : svc.category === 'compute' ? '⚙️' : '🤖'}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-xl font-bold text-white">{svc.name}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">{svc.category}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">● Active</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{svc.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {svc.tags.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500">#{t}</span>)}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-2xl font-bold text-brand-400">{svc.price}</div>
              <div className="text-xs text-gray-500 mb-3">per task</div>
              {done ? (
                <div className="text-xs text-emerald-400">✅ Task submitted!</div>
              ) : (
                <button onClick={handleBuy} disabled={buying}
                  className="px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-colors disabled:opacity-50">
                  {buying ? 'Submitting…' : `Buy Task · ${svc.price}`}
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/5 text-sm">
            {[
              { label: 'Score',   value: `${svc.score}/100`, color: 'text-brand-400' },
              { label: 'SLA',     value: `${svc.sla}ms`,    color: 'text-emerald-400' },
              { label: 'Tasks',   value: svc.tasks.toString(), color: 'text-white' },
              { label: 'Network', value: 'Devnet',           color: 'text-gray-400' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="text-xs text-gray-500">{label}</div>
                <div className={`font-semibold ${color}`}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex gap-1 border-b border-white/10">
            {(['overview','schema','reviews'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === t ? 'border-brand-500 text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="glass rounded-b-xl rounded-tr-xl p-6 mt-0.5 space-y-4">
              <h3 className="font-semibold text-white">How it works</h3>
              <ol className="space-y-3">
                {[`Lock ${svc.price} in escrow smart contract`, 'Provider receives payload via MCP protocol', `Agent executes within ${svc.sla}ms SLA`, 'Proof hash verified, escrow released automatically', 'Reputation score updated on-chain'].map((s,i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-brand-900/50 text-brand-400 flex items-center justify-center text-xs font-bold shrink-0">{i+1}</span>
                    <span className="text-gray-400 leading-relaxed">{s}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 p-4 rounded-xl bg-white/3 border border-white/5">
                <div className="text-xs text-gray-500 mb-1">PROVIDER</div>
                <div className="font-mono text-sm text-white">{svc.provider}</div>
                <div className="text-xs text-gray-500 mt-1">MultiversX · Score {svc.score}/100</div>
              </div>
            </div>
          )}

          {tab === 'schema' && (
            <div className="glass rounded-b-xl rounded-tr-xl p-6 mt-0.5 space-y-4">
              <div>
                <h3 className="font-semibold text-white mb-2">Input Schema</h3>
                <pre className="text-xs bg-black/30 rounded-lg p-4 text-gray-300 overflow-x-auto border border-white/5">{JSON.stringify({type:'object',properties:{query:{type:'string',description:`Input for ${svc.name}`}},required:['query']},null,2)}</pre>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Output Schema</h3>
                <pre className="text-xs bg-black/30 rounded-lg p-4 text-gray-300 overflow-x-auto border border-white/5">{JSON.stringify({type:'object',properties:{result:{type:'string'},proofHash:{type:'string'},latencyMs:{type:'number'}},required:['result','proofHash']},null,2)}</pre>
              </div>
            </div>
          )}

          {tab === 'reviews' && (
            <div className="glass rounded-b-xl rounded-tr-xl p-6 mt-0.5 space-y-3">
              {[{addr:'erd1abc…def',score:5,text:'Sub-200ms, exactly as promised.',ago:'2h'},{addr:'erd1xyz…789',score:5,text:'Reliable and fast. Proof hash verified correctly.',ago:'1d'},{addr:'erd1mno…pqr',score:4,text:'Good service, occasional latency spikes.',ago:'3d'}].map((r,i)=>(
                <div key={i} className="p-4 rounded-xl bg-white/3 border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-gray-500">{r.addr}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400 text-xs">{'★'.repeat(r.score)}</span>
                      <span className="text-xs text-gray-600">{r.ago} ago</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300">{r.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
