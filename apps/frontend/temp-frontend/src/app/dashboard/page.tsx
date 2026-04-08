'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, BarChart3, Shield, TrendingUp, Clock, CheckCircle } from 'lucide-react';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

type DashTab = 'consumer' | 'provider';

const MOCK_CONSUMER_TASKS = [
  { id:'task-c01', service:'DataFetch Pro',  status:'completed', budget:'0.0010', latency:187, ago:'2h ago' },
  { id:'task-c02', service:'ML Compute',     status:'running',   budget:'0.0050', latency:null, ago:'5m ago' },
  { id:'task-c03', service:'Price Oracle',   status:'completed', budget:'0.0005', latency:88,  ago:'1d ago' },
  { id:'task-c04', service:'AML Compliance', status:'pending',   budget:'0.0030', latency:null, ago:'1m ago' },
];

const MOCK_PROVIDER_TASKS = [
  { id:'task-p01', consumer:'erd1abc…0001', status:'completed', earned:'0.0010', latency:210, ago:'3h ago' },
  { id:'task-p02', consumer:'erd1def…0002', status:'completed', earned:'0.0010', latency:165, ago:'6h ago' },
  { id:'task-p03', consumer:'erd1ghi…0003', status:'failed',    earned:'0',      latency:null, ago:'1d ago' },
];

export default function DashboardPage() {
  const [tab,       setTab]       = useState<DashTab>('consumer');
  const [mounted,   setMounted]   = useState(false);
  const [repScore,  setRepScore]  = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    fetch(`${BACKEND}/reputation/leaderboard?limit=1`)
      .then(r => r.json())
      .then((d: unknown) => {
        const arr = d as Array<{ compositeScore?: number }>;
        if (Array.isArray(arr) && arr[0]) setRepScore(arr[0].compositeScore ?? null);
      })
      .catch(() => {});
  }, []);

  const consumerStats = [
    { label:'Total Tasks',   value:'4',      icon: Zap,        color:'text-brand-400' },
    { label:'Completed',     value:'2',      icon: CheckCircle, color:'text-emerald-400' },
    { label:'Total Spent',   value:'0.0065 EGLD', icon: BarChart3, color:'text-white' },
    { label:'Avg Latency',   value:'138ms',  icon: Clock,      color:'text-blue-400' },
  ];

  const providerStats = [
    { label:'Tasks Served',  value:'3',      icon: Zap,         color:'text-brand-400' },
    { label:'Success Rate',  value:'66%',    icon: TrendingUp,  color:'text-emerald-400' },
    { label:'Total Earned',  value:'0.0020 EGLD', icon: BarChart3, color:'text-white' },
    { label:'Rep Score',     value: repScore !== null ? `${repScore}/100` : '—', icon: Shield, color:'text-yellow-400' },
  ];

  const stats = tab === 'consumer' ? consumerStats : providerStats;

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1" suppressHydrationWarning>
              {mounted ? 'Connected — devnet' : 'Loading…'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/services" className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors">Browse Services →</Link>
            <Link href="/services/register" className="px-3 py-1.5 rounded-lg text-xs bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors">+ Register Service</Link>
          </div>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/3 border border-white/5 w-fit">
          {(['consumer','provider'] as DashTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass rounded-xl p-4">
              <Icon size={16} className={`mb-2 ${color}`} />
              <div className={`text-lg font-bold font-mono ${color}`}>{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Task history */}
        <div className="glass rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">
            {tab === 'consumer' ? 'Task History' : 'Served Tasks'}
          </h2>
          <div className="space-y-3">
            {(tab === 'consumer' ? MOCK_CONSUMER_TASKS : MOCK_PROVIDER_TASKS).map((t, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-white truncate">{t.id}</span>
                    <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border ${
                      t.status === 'completed' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30' :
                      t.status === 'running'   ? 'bg-blue-400/10    text-blue-400    border-blue-400/30' :
                      t.status === 'pending'   ? 'bg-yellow-400/10  text-yellow-400  border-yellow-400/30' :
                                                 'bg-red-400/10     text-red-400     border-red-400/30'
                    }`}>{t.status}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {tab === 'consumer'
                      ? `${(t as {service: string}).service} · ${ (t as {latency: number|null}).latency ? (t as {latency: number}).latency + 'ms' : 'in progress'}`
                      : `Consumer: ${(t as {consumer: string}).consumer} · Earned: ${(t as {earned: string}).earned} EGLD`
                    }
                  </div>
                </div>
                <span className="text-xs text-gray-600 shrink-0">{t.ago}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live events feed */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Live Events</h2>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              WebSocket /events
            </span>
          </div>
          <div className="space-y-2">
            {[
              { type:'TaskCreated',      hash:'0xabc…', time:'just now' },
              { type:'TaskCompleted',    hash:'0xdef…', time:'12s ago' },
              { type:'ReputationUpdated',hash:'0xghi…', time:'45s ago' },
            ].map((ev, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30 font-mono">{ev.type}</span>
                  <span className="text-xs font-mono text-gray-500">{ev.hash}</span>
                </div>
                <span className="text-xs text-gray-600">{ev.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
