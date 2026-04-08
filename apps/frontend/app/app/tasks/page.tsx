'use client';

import Link from 'next/link';
import { MOCK_SERVICES } from '@/lib/mock-data';
import { useTasks, type TaskFilter } from '@/hooks/useTasks';

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  quoted: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  paid: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
  running: 'text-purple-400 bg-purple-500/10 border-purple-500/20 animate-pulse',
  completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  failed: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const FILTERS: { value: TaskFilter; label: string }[] = [
  { value: 'all', label: 'Toate' },
  { value: 'pending', label: 'Pending' },
  { value: 'running', label: 'Running' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

export default function TasksPage() {
  const { tasks, filter, setFilter, stats } = useTasks();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-text mb-1">Tasks</h1>
        <p className="text-dark-muted text-sm">Execuții on-chain ale serviciilor agentice</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', val: stats.total, color: 'text-dark-text' },
          { label: 'Pending', val: stats.pending, color: 'text-amber-400' },
          { label: 'Running', val: stats.running, color: 'text-purple-400' },
          { label: 'Completed', val: stats.completed, color: 'text-emerald-400' },
          { label: 'Failed', val: stats.failed, color: 'text-red-400' },
        ].map(({ label, val, color }) => (
          <div key={label} className="stat-card text-center">
            <p className={`text-xl font-bold font-mono ${color}`}>{val}</p>
            <p className="text-xs text-dark-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              filter === f.value
                ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                : 'bg-dark-surface2 text-dark-muted border-dark-border hover:text-dark-text'
            }`}
          >{f.label}</button>
        ))}
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-dark-muted">
          <span className="text-4xl">⚡</span>
          <p className="text-sm">Niciun task pentru filtrul selectat</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
            const svc = MOCK_SERVICES.find(s => s.id === task.serviceId);
            return (
              <Link key={task.id} href={`/tasks/${task.id}`} className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-brand-500/30 transition-all group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge border text-xs ${STATUS_COLORS[task.status]}`}>{task.status}</span>
                    <span className="text-xs font-mono text-dark-muted">{task.id}</span>
                  </div>
                  <p className="font-semibold text-dark-text group-hover:text-brand-400 transition-colors">{svc?.name ?? task.serviceId}</p>
                  <p className="text-xs text-dark-muted mt-0.5">{new Date(task.createdAt).toLocaleString('ro-RO')}</p>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-xs text-dark-muted">Budget</p>
                    <p className="text-sm font-mono text-dark-text">{task.maxBudget} EGLD</p>
                  </div>
                  {task.latencyMs && (
                    <div>
                      <p className="text-xs text-dark-muted">Latență</p>
                      <p className="text-sm font-mono text-emerald-400">{task.latencyMs}ms</p>
                    </div>
                  )}
                  <span className="text-dark-muted group-hover:text-brand-400 transition-colors">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
