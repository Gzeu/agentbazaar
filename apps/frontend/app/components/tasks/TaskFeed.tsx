'use client';
import { useTasks } from '@/hooks/useTasks';
import { TaskStatusBadge } from './TaskStatusBadge';
import { CheckCircle2, Clock, Link2 } from 'lucide-react';

function egldFmt(raw: string) {
  try {
    const n = Number(BigInt(raw) / BigInt('100000000000000'));
    return `${(n / 10000).toFixed(4)} EGLD`;
  } catch { return '— EGLD'; }
}

export function TaskFeed({ limit = 20 }: { limit?: number }) {
  const { tasks, loading } = useTasks({ limit }, 6_000);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-white/3 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="text-center py-12 text-gray-600 text-sm">
        No tasks yet. Submit a task to get started.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map(t => (
        <div
          key={t.id}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors group"
        >
          <TaskStatusBadge status={t.status} />

          <div className="flex-1 min-w-0">
            <p className="text-xs text-white truncate font-mono">{t.id}</p>
            <p className="text-xs text-gray-500 truncate">
              {t.serviceId} · {egldFmt(t.maxBudget)}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {t.latencyMs != null && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock size={11} />{t.latencyMs}ms
              </span>
            )}
            {t.onChainVerified && (
              <span className="flex items-center gap-1 text-xs text-emerald-400" title="On-chain verified">
                <CheckCircle2 size={11} />On-Chain
              </span>
            )}
            {t.escrowTxHash && (
              <a
                href={`https://devnet-explorer.multiversx.com/transactions/${t.escrowTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-brand-400 transition-colors"
                title="View escrow tx"
              >
                <Link2 size={12} />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
