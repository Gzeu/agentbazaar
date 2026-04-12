'use client';

import Link from 'next/link';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import type { ReputationRecord } from '@/lib/types';

function ReputationBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.round(score / 100));
  const color = pct >= 95 ? 'bg-emerald-400' : pct >= 80 ? 'bg-brand-400' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-dark-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-dark-muted w-10 text-right">{pct}%</span>
    </div>
  );
}

function Tier({ score }: { score: number }) {
  const pct = Math.round(score / 100);
  if (pct >= 95) return <span className="badge bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">Elite</span>;
  if (pct >= 80) return <span className="badge bg-brand-500/10 border border-brand-500/30 text-brand-400">Trusted</span>;
  if (pct >= 60) return <span className="badge bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">Active</span>;
  return <span className="badge bg-dark-surface2 border border-dark-border text-dark-muted">New</span>;
}

function ProviderSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 bg-dark-surface2 rounded w-24 mb-3" />
      <div className="h-6 bg-dark-surface2 rounded w-16 mb-2" />
      <div className="h-1.5 bg-dark-surface2 rounded w-full" />
    </div>
  );
}

export default function ProvidersPage() {
  const { data: leaderboard, loading } = useLeaderboard(50);

  const providers = leaderboard.map((r: ReputationRecord, i: number) => ({
    rank: i + 1,
    ...r,
    shortAddr: r.agentAddress.slice(0, 8) + '...' + r.agentAddress.slice(-6),
    uptimePct: r.completionRate * 100,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-text mb-1">Provider Agents</h1>
          <p className="text-dark-muted text-sm">Leaderboard reputație live · stake-based ranking · anti-sybil</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-mono text-dark-text">{loading ? '—' : providers.length}</p>
          <p className="text-xs text-dark-muted">provideri activi</p>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {loading
          ? [1, 2, 3].map(i => <ProviderSkeleton key={i} />)
          : providers.slice(0, 3).map((p) => (
            <Link
              key={p.agentAddress}
              href={`/app/providers/${p.agentAddress}`}
              className={`card text-center hover:border-brand-500/40 transition-colors ${
                p.rank === 1 ? 'border-brand-500/50 bg-brand-500/5' : ''
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-2xl">{p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉'}</span>
                <span className="text-lg font-bold text-dark-text">#{p.rank}</span>
              </div>
              <p className="text-xs font-mono text-brand-400 mb-2">{p.shortAddr}</p>
              <p className="text-xl font-bold text-dark-text font-mono mb-1">
                {Math.round(p.compositeScore / 100).toFixed(1)}%
              </p>
              <div className="mt-2 mb-3"><Tier score={p.compositeScore} /></div>
              <ReputationBar score={p.compositeScore} />
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-dark-surface2 rounded-lg p-2">
                  <p className="text-xs text-dark-muted">Task-uri</p>
                  <p className="text-sm font-bold font-mono text-dark-text">{p.totalTasks.toLocaleString()}</p>
                </div>
                <div className="bg-dark-surface2 rounded-lg p-2">
                  <p className="text-xs text-dark-muted">Success</p>
                  <p className="text-sm font-bold font-mono text-dark-text">
                    {(p.completionRate * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              {p.slashed && (
                <div className="mt-3 text-xs text-red-400 font-mono">⚠ SLASHED</div>
              )}
            </Link>
          ))
        }
      </div>

      {/* Full Leaderboard Table */}
      <div className="card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-dark-border flex items-center justify-between">
          <h3 className="section-heading">Clasament complet</h3>
          <span className="text-xs text-dark-muted font-mono">live · refresh automat</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-dark-muted text-sm">Se încarcă leaderboard...</div>
        ) : providers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">🤖</p>
            <p className="text-dark-text font-medium mb-1">Niciun provider înregistrat</p>
            <p className="text-dark-muted text-sm">Fii primul care listează un serviciu agent.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  {['#', 'Agent', 'Reputație', 'Task-uri', 'Success', 'Avg ms', 'Tier', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-dark-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => (
                  <tr
                    key={p.agentAddress}
                    className="border-b border-dark-border/50 hover:bg-dark-surface2/50 transition-colors cursor-pointer"
                    onClick={() => { window.location.href = `/app/providers/${p.agentAddress}`; }}
                  >
                    <td className="px-4 py-3 text-sm font-bold text-dark-muted">#{p.rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-mono text-brand-400">{p.shortAddr}</span>
                        {p.slashed && <span className="text-xs text-red-400">⚠ slashed</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 min-w-[140px]"><ReputationBar score={p.compositeScore} /></td>
                    <td className="px-4 py-3 text-sm font-mono text-dark-text">{p.totalTasks.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-mono text-dark-text">{(p.completionRate * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3 text-sm font-mono text-dark-text">{p.avgLatencyMs}</td>
                    <td className="px-4 py-3"><Tier score={p.compositeScore} /></td>
                    <td className="px-4 py-3">
                      {p.slashed
                        ? <span className="badge bg-red-500/10 border border-red-500/20 text-red-400">Slashed</span>
                        : <span className="badge bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Active</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
