'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Zap, Clock, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, ExternalLink, Wallet, ShieldAlert, Timer
} from 'lucide-react';
import Link from 'next/link';
import { useWalletCtx } from '@/context/WalletContext';

const BACKEND  = process.env.NEXT_PUBLIC_BACKEND_URL  ?? 'http://localhost:3001';
const EXPLORER = process.env.NEXT_PUBLIC_MVX_EXPLORER ?? 'https://devnet-explorer.multiversx.com';

type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'disputed';
type TaskTab    = 'consumer' | 'provider';

interface Task {
  id: string;
  serviceId: string;
  serviceName?: string;
  consumerId: string;
  providerAddress: string;
  status: TaskStatus;
  maxBudget: string;      // in smallest EGLD unit (10^18)
  earnedAmount?: string;
  latencyMs?: number;
  createdAt: string;
  deadline: string;
  txHash?: string;
  disputeReason?: string;
}

/* -------- UI helpers -------- */
const STATUS_ICON: Record<TaskStatus, React.ReactNode> = {
  pending:   <Clock         size={14} className="text-yellow-400" />,
  running:   <Zap           size={14} className="text-blue-400 animate-pulse" />,
  completed: <CheckCircle   size={14} className="text-emerald-400" />,
  failed:    <XCircle       size={14} className="text-red-400" />,
  disputed:  <AlertTriangle size={14} className="text-orange-400" />,
};

const STATUS_COLOR: Record<TaskStatus, string> = {
  pending:   'bg-yellow-400/10  text-yellow-400  border-yellow-400/30',
  running:   'bg-blue-400/10    text-blue-400    border-blue-400/30',
  completed: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
  failed:    'bg-red-400/10     text-red-400     border-red-400/30',
  disputed:  'bg-orange-400/10  text-orange-400  border-orange-400/30',
};

function fmtEgld(raw: string): string {
  try { return (Number(BigInt(raw)) / 1e18).toFixed(4) + ' EGLD'; }
  catch { return raw + ' EGLD'; }
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function deadlineLabel(iso: string): { text: string; urgent: boolean } {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return { text: 'Expired', urgent: true };
  const m = Math.floor(diff / 60000);
  if (m < 60)    return { text: `${m}m left`, urgent: m < 10 };
  const h = Math.floor(diff / 3600000);
  if (h < 24)    return { text: `${h}h left`, urgent: false };
  return { text: `${Math.floor(diff / 86400000)}d left`, urgent: false };
}

/* -------- component -------- */
export default function TasksPage() {
  const { connected, address, signAndSend } = useWalletCtx();

  const [tab,       setTab]       = useState<TaskTab>('consumer');
  const [tasks,     setTasks]     = useState<Task[]>([]);
  const [filter,    setFilter]    = useState<TaskStatus | 'all'>('all');
  const [loading,   setLoading]   = useState(false);
  const [refreshing,setRefreshing]= useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [disputing, setDisputing] = useState<string | null>(null); // task id

  const loadTasks = useCallback(async (addr: string, role: TaskTab) => {
    setRefreshing(true);
    setError(null);
    try {
      const param = role === 'consumer' ? 'consumer' : 'provider';
      const res = await fetch(`${BACKEND}/tasks?${param}=${addr}&limit=50`);
      if (res.ok) {
        const data = await res.json() as Task[] | { data?: Task[] };
        setTasks(Array.isArray(data) ? data : (data.data ?? []));
      } else {
        setError(`Backend returned ${res.status}`);
        setTasks([]);
      }
    } catch {
      setError('Could not reach backend.');
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!connected || !address) return;
    setLoading(true);
    loadTasks(address, tab);
  }, [connected, address, tab, loadTasks]);

  /* ---- dispute ---- */
  const openDispute = async (task: Task) => {
    if (!connected || !address) return;
    setDisputing(task.id);
    try {
      const DISPUTE_CONTRACT = process.env.NEXT_PUBLIC_ESCROW_CONTRACT ?? '';
      await signAndSend({
        receiver: DISPUTE_CONTRACT,
        value: '0',
        data: `dispute@${Buffer.from(task.id).toString('hex')}`,
        gasLimit: 10_000_000,
      });
      // refresh after TX
      await loadTasks(address!, tab);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Dispute transaction failed.');
    } finally {
      setDisputing(null);
    }
  };

  /* ---- derived ---- */
  const displayed = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const counts: Record<string, number> = { all: tasks.length };
  (['pending','running','completed','failed','disputed'] as TaskStatus[]).forEach(s => {
    counts[s] = tasks.filter(t => t.status === s).length;
  });

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Tasks</h1>
            <p className="text-sm text-gray-400 mt-1">On-chain task execution history</p>
          </div>
          <button
            onClick={() => address && loadTasks(address, tab)}
            disabled={refreshing || !connected}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 text-xs hover:text-white transition-colors disabled:opacity-30"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <XCircle size={14} /> {error}
          </div>
        )}

        {/* No wallet */}
        {!connected ? (
          <div className="glass rounded-xl p-12 text-center">
            <Wallet size={32} className="mx-auto text-gray-600 mb-3" />
            <p className="text-white font-semibold mb-1">No wallet connected</p>
            <p className="text-sm text-gray-500">Connect your wallet from the navbar to see your tasks.</p>
          </div>
        ) : (
          <>
            {/* Consumer / Provider tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/3 border border-white/5 w-fit">
              {(['consumer', 'provider'] as TaskTab[]).map(t => (
                <button key={t} onClick={() => { setTab(t); setFilter('all'); }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    tab === t ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}>
                  {t === 'consumer' ? '🛒 Consumer' : '🤖 Provider'}
                </button>
              ))}
            </div>

            {/* Status filter pills */}
            <div className="flex gap-2 flex-wrap">
              {(['all','pending','running','completed','failed','disputed'] as const).map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    filter === s
                      ? 'border-brand-500/50 bg-brand-500/20 text-brand-300'
                      : 'border-white/10 text-gray-500 hover:text-gray-300'
                  }`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                  <span className="ml-1.5 opacity-60">{counts[s] ?? 0}</span>
                </button>
              ))}
            </div>

            {/* List */}
            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4].map(i => <div key={i} className="glass rounded-xl h-24 animate-pulse" />)}
              </div>
            ) : displayed.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-gray-500 text-sm mb-2">No tasks found.</p>
                {tab === 'consumer' && (
                  <Link href="/" className="text-xs text-brand-400 hover:underline">Browse services →</Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {displayed.map(task => {
                  const dl = deadlineLabel(task.deadline);
                  const canDispute = tab === 'consumer' &&
                    (task.status === 'failed' || task.status === 'running') &&
                    task.status !== 'disputed';

                  return (
                    <div key={task.id} className="glass rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">

                      {/* Left: icon + info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-0.5 shrink-0">{STATUS_ICON[task.status]}</div>
                        <div className="min-w-0 flex-1">

                          {/* Row 1: ID + badge */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm text-white truncate">{task.id}</span>
                            <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLOR[task.status]}`}>
                              {task.status}
                            </span>
                          </div>

                          {/* Row 2: service + budget + latency */}
                          <div className="text-xs text-gray-500 mt-0.5">
                            {task.serviceName ?? task.serviceId}
                            {' · '}
                            {tab === 'consumer'
                              ? `Budget: ${fmtEgld(task.maxBudget)}`
                              : `Earned: ${task.earnedAmount ? fmtEgld(task.earnedAmount) : '—'}`
                            }
                            {task.latencyMs ? ` · ${task.latencyMs}ms` : ''}
                          </div>

                          {/* Row 3: provider/consumer address */}
                          <div className="text-[10px] text-gray-600 mt-0.5 font-mono">
                            {tab === 'consumer'
                              ? <>Provider: <a href={`${EXPLORER}/accounts/${task.providerAddress}`} target="_blank" rel="noreferrer" className="hover:text-brand-400 transition-colors">{task.providerAddress.slice(0,10)}…</a></>
                              : <>Consumer: <a href={`${EXPLORER}/accounts/${task.consumerId}`}      target="_blank" rel="noreferrer" className="hover:text-brand-400 transition-colors">{task.consumerId.slice(0,10)}…</a></>
                            }
                          </div>

                          {/* Dispute reason if disputed */}
                          {task.status === 'disputed' && task.disputeReason && (
                            <div className="mt-1 text-[10px] text-orange-400/80 flex items-center gap-1">
                              <ShieldAlert size={10} /> {task.disputeReason}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: deadline + time + TX link + dispute btn */}
                      <div className="flex items-center gap-3 sm:flex-col sm:items-end shrink-0 text-right">

                        {/* Deadline */}
                        {(task.status === 'pending' || task.status === 'running') && (
                          <span className={`flex items-center gap-1 text-[10px] font-mono ${
                            dl.urgent ? 'text-red-400' : 'text-gray-500'
                          }`}>
                            <Timer size={10} /> {dl.text}
                          </span>
                        )}

                        {/* Created */}
                        <span className="text-xs text-gray-600">{timeAgo(task.createdAt)}</span>

                        {/* TX Explorer link */}
                        {task.txHash && (
                          <a
                            href={`${EXPLORER}/transactions/${task.txHash}`}
                            target="_blank" rel="noreferrer"
                            className="text-gray-600 hover:text-brand-400 transition-colors"
                            title="View on explorer"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}

                        {/* Dispute button */}
                        {canDispute && (
                          <button
                            onClick={() => openDispute(task)}
                            disabled={disputing === task.id}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition-colors disabled:opacity-50"
                          >
                            {disputing === task.id
                              ? <><span className="w-2.5 h-2.5 border border-orange-400 border-t-transparent rounded-full animate-spin" /> Sending…</>
                              : <><ShieldAlert size={10} /> Dispute</>
                            }
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
