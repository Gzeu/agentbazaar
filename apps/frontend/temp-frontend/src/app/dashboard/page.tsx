'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Zap, BarChart3, Shield, TrendingUp,
  Clock, CheckCircle, Wallet, RefreshCw,
  ExternalLink, AlertCircle
} from 'lucide-react';
import { useWalletCtx } from '@/context/WalletContext';

const BACKEND  = process.env.NEXT_PUBLIC_BACKEND_URL  ?? 'http://localhost:3001';
const EXPLORER = process.env.NEXT_PUBLIC_MVX_EXPLORER ?? 'https://devnet-explorer.multiversx.com';

type DashTab = 'consumer' | 'provider';

interface Task {
  id: string;
  serviceId?: string;
  serviceName?: string;
  consumer?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'disputed';
  budget?: string;
  earned?: string;
  latencyMs?: number;
  createdAt: string;
  txHash?: string;
}

interface ReputationEntry {
  address: string;
  compositeScore: number;
  totalTasks: number;
  successRate: number;
}

interface LiveEvent {
  type: string;
  hash: string;
  time: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const STATUS_STYLE: Record<string, string> = {
  completed: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
  running:   'bg-blue-400/10    text-blue-400    border-blue-400/30',
  pending:   'bg-yellow-400/10  text-yellow-400  border-yellow-400/30',
  failed:    'bg-red-400/10     text-red-400     border-red-400/30',
  disputed:  'bg-orange-400/10  text-orange-400  border-orange-400/30',
};

export default function DashboardPage() {
  const { connected, address, balance } = useWalletCtx();

  const [tab,           setTab]           = useState<DashTab>('consumer');
  const [consumerTasks, setConsumerTasks] = useState<Task[]>([]);
  const [providerTasks, setProviderTasks] = useState<Task[]>([]);
  const [reputation,    setReputation]    = useState<ReputationEntry | null>(null);
  const [liveEvents,    setLiveEvents]    = useState<LiveEvent[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [refreshing,    setRefreshing]    = useState(false);

  async function fetchJSON<T>(url: string): Promise<T | null> {
    try {
      const r = await fetch(url);
      if (!r.ok) return null;
      return r.json() as Promise<T>;
    } catch { return null; }
  }

  const fetchData = useCallback(async (addr: string) => {
    setRefreshing(true);
    setError(null);
    try {
      const [cTasks, pTasks, rep, events] = await Promise.all([
        fetchJSON<Task[]>(`${BACKEND}/tasks?consumer=${addr}&limit=20`),
        fetchJSON<Task[]>(`${BACKEND}/tasks?provider=${addr}&limit=20`),
        fetchJSON<ReputationEntry>(`${BACKEND}/reputation/${addr}`),
        fetchJSON<LiveEvent[]>(`${BACKEND}/events/recent?limit=5`),
      ]);
      if (cTasks) setConsumerTasks(cTasks);
      if (pTasks) setProviderTasks(pTasks);
      if (rep)    setReputation(rep);
      if (events) setLiveEvents(events);
    } catch {
      setError('Could not load data from backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!connected || !address) return;
    setLoading(true);
    fetchData(address);
    const interval = setInterval(() => fetchData(address), 30_000);
    return () => clearInterval(interval);
  }, [connected, address, fetchData]);

  /* derived stats */
  const cCompleted = consumerTasks.filter(t => t.status === 'completed').length;
  const cSpent     = consumerTasks.reduce((acc, t) => acc + parseFloat(t.budget ?? '0'), 0).toFixed(4);
  const cLatencies = consumerTasks.filter(t => t.latencyMs).map(t => t.latencyMs!);
  const cAvgLat    = cLatencies.length
    ? Math.round(cLatencies.reduce((a, b) => a + b, 0) / cLatencies.length) + 'ms'
    : '—';

  const pCompleted   = providerTasks.filter(t => t.status === 'completed').length;
  const pSuccessRate = providerTasks.length
    ? Math.round((pCompleted / providerTasks.length) * 100) + '%'
    : '—';
  const pEarned = providerTasks.reduce((acc, t) => acc + parseFloat(t.earned ?? '0'), 0).toFixed(4);

  const consumerStats = [
    { label: 'Total Tasks', value: String(consumerTasks.length), icon: Zap,         color: 'text-brand-400' },
    { label: 'Completed',   value: String(cCompleted),           icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'Total Spent', value: `${cSpent} EGLD`,             icon: BarChart3,   color: 'text-white' },
    { label: 'Avg Latency', value: cAvgLat,                      icon: Clock,       color: 'text-blue-400' },
  ];

  const providerStats = [
    { label: 'Tasks Served', value: String(providerTasks.length),                                        icon: Zap,        color: 'text-brand-400' },
    { label: 'Success Rate', value: pSuccessRate,                                                         icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Total Earned', value: `${pEarned} EGLD`,                                                   icon: BarChart3,  color: 'text-white' },
    { label: 'Rep Score',    value: reputation ? `${reputation.compositeScore}/100` : '—',               icon: Shield,     color: 'text-yellow-400' },
  ];

  const stats = tab === 'consumer' ? consumerStats : providerStats;
  const tasks = tab === 'consumer' ? consumerTasks : providerTasks;

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            {connected && address ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <a
                  href={`${EXPLORER}/accounts/${address}`}
                  target="_blank" rel="noreferrer"
                  className="text-xs text-gray-400 hover:text-white font-mono flex items-center gap-1 transition-colors"
                >
                  {address.slice(0, 8)}…{address.slice(-6)}
                  <ExternalLink size={10} />
                </a>
                {balance && (
                  <span className="flex items-center gap-1 text-xs text-emerald-300 font-mono">
                    <Wallet size={11} />
                    {balance} EGLD
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-yellow-400 flex items-center gap-1 mt-1">
                <AlertCircle size={12} />
                Wallet not connected
              </span>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => address && fetchData(address)}
              disabled={refreshing || !connected}
              className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors disabled:opacity-30"
              title="Refresh"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <Link href="/" className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-gray-400 hover:text-white transition-colors">Browse →</Link>
            <Link href="/services/register" className="px-3 py-1.5 rounded-lg text-xs bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors">+ Register Service</Link>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {!connected ? (
          <div className="glass rounded-xl p-10 text-center">
            <Wallet size={32} className="mx-auto text-gray-600 mb-3" />
            <p className="text-white font-semibold mb-1">No wallet connected</p>
            <p className="text-sm text-gray-500">Click <strong>Connect Wallet</strong> in the navbar to continue.</p>
          </div>
        ) : (
          <>
            {/* Tab toggle */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/3 border border-white/5 w-fit">
              {(['consumer', 'provider'] as DashTab[]).map(t => (
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
                  <div className={`text-lg font-bold font-mono ${color}`}>
                    {loading ? <span className="animate-pulse">—</span> : value}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Task history */}
            <div className="glass rounded-xl p-5">
              <h2 className="font-semibold text-white mb-4">
                {tab === 'consumer' ? 'Task History' : 'Served Tasks'}
                {tasks.length > 0 && (
                  <span className="ml-2 text-xs text-gray-500 font-normal">{tasks.length} records</span>
                )}
              </h2>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />)}
                </div>
              ) : tasks.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-gray-500 text-sm">No tasks yet.</p>
                  {tab === 'consumer' && (
                    <Link href="/" className="text-xs text-brand-400 hover:underline mt-2 inline-block">Browse services →</Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map(t => (
                    <div key={t.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-white truncate">{t.id}</span>
                          <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border ${STATUS_STYLE[t.status] ?? STATUS_STYLE.pending}`}>
                            {t.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {tab === 'consumer'
                            ? `${t.serviceName ?? t.serviceId ?? '—'} · ${t.latencyMs ? t.latencyMs + 'ms' : 'in progress'} · ${t.budget ?? '—'} EGLD`
                            : `Consumer: ${t.consumer?.slice(0, 8) ?? '?'}… · Earned: ${t.earned ?? '0'} EGLD`
                          }
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {t.txHash && (
                          <a href={`${EXPLORER}/transactions/${t.txHash}`} target="_blank" rel="noreferrer"
                            className="text-gray-600 hover:text-brand-400 transition-colors" title="View on explorer">
                            <ExternalLink size={12} />
                          </a>
                        )}
                        <span className="text-xs text-gray-600">{timeAgo(t.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Events */}
            <div className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">Live Events</h2>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  auto-refresh 30s
                </span>
              </div>
              {liveEvents.length === 0 ? (
                <p className="text-xs text-gray-500 py-4 text-center">No recent events.</p>
              ) : (
                <div className="space-y-2">
                  {liveEvents.map((ev, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30 font-mono">{ev.type}</span>
                        <a href={`${EXPLORER}/transactions/${ev.hash}`} target="_blank" rel="noreferrer"
                          className="text-xs font-mono text-gray-500 hover:text-brand-400 transition-colors">
                          {ev.hash}
                        </a>
                      </div>
                      <span className="text-xs text-gray-600">{ev.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
