'use client';

import { use } from 'react';
import Link from 'next/link';
import { useReputation } from '@/hooks/useReputation';
import { useTasks } from '@/hooks/useTasks';
import { TaskStatusBadge } from '@/components/ui/TaskStatusBadge';

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card text-center">
      <p className="text-2xl font-bold font-mono text-dark-text">{value}</p>
      {sub && <p className="text-xs font-mono text-brand-400">{sub}</p>}
      <p className="text-xs text-dark-muted mt-1">{label}</p>
    </div>
  );
}

export default function ProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: rep, loading: repLoading } = useReputation(id);
  const { tasks, loading: tasksLoading } = useTasks(0); // 0 = no polling

  const providerTasks = tasks.filter(t => t.providerAddress === id).slice(0, 20);
  const shortAddr = id.slice(0, 10) + '...' + id.slice(-8);
  const explorerUrl = `https://devnet-explorer.multiversx.com/accounts/${id}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-dark-muted mb-6">
        <Link href="/app/providers" className="hover:text-brand-400 transition-colors">Providers</Link>
        <span>/</span>
        <span className="font-mono text-dark-text">{shortAddr}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
              <span className="text-lg">🤖</span>
            </div>
            <div>
              <p className="font-mono text-sm text-brand-400">{shortAddr}</p>
              {rep?.slashed && (
                <span className="text-xs text-red-400 font-mono">⚠ SLASHED</span>
              )}
            </div>
          </div>
        </div>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-dark-muted hover:text-brand-400 transition-colors flex items-center gap-1"
        >
          <span>Explorer</span>
          <span>↗</span>
        </a>
      </div>

      {/* Stats Grid */}
      {repLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="card animate-pulse h-20" />)}
        </div>
      ) : rep ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Stat label="Scor reputație" value={`${(rep.compositeScore / 100).toFixed(1)}%`} />
          <Stat label="Task-uri totale" value={rep.totalTasks.toLocaleString()} />
          <Stat label="Rată succes" value={`${(rep.completionRate * 100).toFixed(1)}%`} />
          <Stat label="Latență medie" value={`${rep.avgLatencyMs}ms`} />
        </div>
      ) : (
        <div className="card mb-8 text-center py-8">
          <p className="text-dark-muted text-sm">Nu există date de reputație on-chain pentru acest agent.</p>
        </div>
      )}

      {/* Dispute / Slash info */}
      {rep && rep.disputedTasks > 0 && (
        <div className="card border-red-500/20 bg-red-500/5 mb-6 flex items-center gap-3">
          <span className="text-red-400 text-xl">⚠</span>
          <div>
            <p className="text-sm font-medium text-red-400">Task-uri disputate: {rep.disputedTasks}</p>
            <p className="text-xs text-dark-muted">Successful: {rep.successfulTasks} · Total: {rep.totalTasks}</p>
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      <div className="card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-dark-border">
          <h3 className="section-heading">Task-uri recente</h3>
        </div>
        {tasksLoading ? (
          <div className="p-8 text-center text-dark-muted text-sm animate-pulse">Se încarcă...</div>
        ) : providerTasks.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-dark-muted text-sm">Niciun task pentru acest provider.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Task ID', 'Service', 'Status', 'Latență', 'Data'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-dark-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {providerTasks.map((t) => (
                  <tr key={t.id} className="border-b border-dark-border/50 hover:bg-dark-surface2/50 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-dark-text">{t.id.slice(0, 12)}…</td>
                    <td className="px-4 py-3 text-xs font-mono text-brand-400">{t.serviceId.slice(0, 10)}…</td>
                    <td className="px-4 py-3"><TaskStatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-xs font-mono text-dark-muted">
                      {t.latencyMs ? `${t.latencyMs}ms` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-dark-muted">
                      {new Date(t.createdAt).toLocaleDateString('ro-RO')}
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
