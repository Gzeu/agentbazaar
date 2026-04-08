'use client';

import { useTasks } from '@/hooks/useTasks';
import { Skeleton } from '@/components/ui/Skeleton';
import { clsx } from 'clsx';
import { Zap, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  running:   'bg-brand-500/10 text-brand-400 border-brand-500/20',
  completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  failed:    'bg-red-500/10 text-red-400 border-red-500/20',
  disputed:  'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending:   <Clock size={12} />,
  running:   <Zap size={12} />,
  completed: <CheckCircle size={12} />,
  failed:    <AlertCircle size={12} />,
  disputed:  <AlertCircle size={12} />,
};

export function TasksList() {
  const { data, isLoading } = useTasks();

  if (isLoading) return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
    </div>
  );

  if (!data?.length) return (
    <div className="text-center py-20 text-dark-muted">
      <Zap size={32} className="mx-auto mb-3 opacity-30" />
      <p className="text-sm">Niciun task încă. Submitează primul task!</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {data.map((task) => (
        <div key={task.id} className="card flex items-center justify-between gap-4 hover:border-brand-500/30">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={clsx('badge border flex items-center gap-1', STATUS_STYLES[task.status] || STATUS_STYLES.pending)}>
                {STATUS_ICONS[task.status]}
                {task.status}
              </span>
              <span className="text-xs text-dark-muted font-mono truncate">{task.id.slice(0, 8)}…</span>
            </div>
            <p className="text-sm text-dark-text font-medium truncate">Service: {task.serviceId.slice(0, 16)}…</p>
            <p className="text-xs text-dark-muted mt-0.5">{new Date(task.createdAt).toLocaleString()}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-mono text-brand-400">{task.maxBudget} EGLD</div>
            {task.latencyMs && <div className="text-xs text-dark-muted mt-0.5">{task.latencyMs}ms</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
