'use client';

import { useState, useMemo } from 'react';
import { MOCK_TASKS, MOCK_SERVICES } from '@/lib/mock-data';
import type { Task, TaskStatus } from '@/lib/types';

const STATUS_STYLES: Record<TaskStatus, string> = {
  completed: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  running:   'text-brand-400 bg-brand-400/10 border-brand-400/20',
  pending:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  failed:    'text-red-400 bg-red-400/10 border-red-400/20',
  disputed:  'text-orange-400 bg-orange-400/10 border-orange-400/20',
};

const STATUS_ICONS: Record<TaskStatus, string> = {
  completed: '✓', running: '⟳', pending: '◌', failed: '✕', disputed: '⚠',
};

function TaskCard({ task }: { task: Task }) {
  const service = MOCK_SERVICES.find(s => s.id === task.serviceId);
  const [open, setOpen] = useState(false);

  return (
    <div className="card hover:border-dark-border/80 transition-all">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setOpen(!open)}>
        <span className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold flex-shrink-0 ${STATUS_STYLES[task.status]}`}>
          {STATUS_ICONS[task.status]}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-dark-text truncate">{service?.name ?? task.serviceId}</p>
          <p className="text-xs text-dark-muted font-mono">{task.id}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className={`badge border ${STATUS_STYLES[task.status]}`}>{task.status}</span>
          <p className="text-xs text-dark-muted mt-1">
            {task.latencyMs ? `${task.latencyMs}ms` : '—'}
          </p>
        </div>
        <span className={`text-dark-muted text-sm transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </div>

      {open && (
        <div className="mt-4 pt-4 border-t border-dark-border space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-dark-surface2 rounded-lg p-3">
              <p className="label">Consumer</p>
              <p className="text-xs font-mono text-dark-text truncate">{task.consumerId}</p>
            </div>
            <div className="bg-dark-surface2 rounded-lg p-3">
              <p className="label">Budget Max</p>
              <p className="text-sm font-bold font-mono text-brand-400">{task.maxBudget} EGLD</p>
            </div>
            <div className="bg-dark-surface2 rounded-lg p-3">
              <p className="label">Creat</p>
              <p className="text-xs text-dark-text">{new Date(task.createdAt).toLocaleTimeString('ro-RO')}</p>
            </div>
            <div className="bg-dark-surface2 rounded-lg p-3">
              <p className="label">Deadline</p>
              <p className="text-xs text-dark-text">{new Date(task.deadline).toLocaleTimeString('ro-RO')}</p>
            </div>
          </div>

          {task.proofHash && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
              <p className="label text-emerald-400">Proof Hash</p>
              <p className="text-xs font-mono text-emerald-400 break-all">{task.proofHash}</p>
            </div>
          )}

          {task.result && (
            <div className="bg-dark-surface2 rounded-lg p-3">
              <p className="label">Rezultat</p>
              <pre className="text-xs font-mono text-brand-400 overflow-auto max-h-24">{JSON.stringify(task.result, null, 2)}</pre>
            </div>
          )}

          <div className="bg-dark-surface2 rounded-lg p-3">
            <p className="label">Payload</p>
            <pre className="text-xs font-mono text-dark-muted overflow-auto max-h-24">{JSON.stringify(task.payload, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');

  const filtered = useMemo(
    () => MOCK_TASKS.filter(t => filter === 'all' || t.status === filter),
    [filter]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: MOCK_TASKS.length };
    MOCK_TASKS.forEach(t => { c[t.status] = (c[t.status] || 0) + 1; });
    return c;
  }, []);

  const statuses: (TaskStatus | 'all')[] = ['all', 'completed', 'running', 'pending', 'failed', 'disputed'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-text mb-1">Task-uri</h1>
        <p className="text-dark-muted text-sm">Monitorizare execuție agent-to-agent în timp real</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {(['completed', 'running', 'pending', 'failed', 'disputed'] as TaskStatus[]).map(s => (
          <div key={s} className={`stat-card border ${STATUS_STYLES[s]} cursor-pointer hover:opacity-80 transition-opacity`} onClick={() => setFilter(s)}>
            <p className="text-xs uppercase tracking-wider opacity-70">{s}</p>
            <p className="text-xl font-bold font-mono mt-1">{counts[s] || 0}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all capitalize ${
              filter === s
                ? 'bg-brand-500 border-brand-500 text-white'
                : 'bg-dark-surface2 border-dark-border text-dark-muted hover:border-brand-500/40'
            }`}
          >
            {s === 'all' ? `Toate (${counts.all})` : `${s} (${counts[s] || 0})`}
          </button>
        ))}
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-dark-muted">Niciun task pentru filtrul selectat.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => <TaskCard key={task.id} task={task} />)}
        </div>
      )}
    </div>
  );
}
