'use client';

import { useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { TaskCard } from './TaskCard';
import type { Task } from '@/lib/types';

export function TasksList() {
  const {
    tasks, stats, loading, error, filter, setFilter, hasMore, loadMore, refresh
  } = useTasks();

  // Local override map so UI updates instantly without waiting for next poll
  const [overrides, setOverrides] = useState<Record<string, Task>>({});

  const handleUpdated = useCallback((updated: Task) => {
    setOverrides(prev => ({ ...prev, [updated.id]: updated }));
  }, []);

  // Merge overrides into tasks list
  const displayTasks = tasks.map(t => overrides[t.id] ?? t);

  const FILTERS = ['all', 'pending', 'running', 'completed', 'failed', 'disputed', 'refunded'] as const;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total',     value: stats.total },
          { label: 'Running',   value: stats.running },
          { label: 'Completed', value: stats.completed },
          { label: 'Avg ms',    value: stats.avgLatency },
        ].map(({ label, value }) => (
          <div key={label} className="glass rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-white">{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar + refresh */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              filter === f
                ? 'border-brand-500 bg-brand-900/30 text-brand-300'
                : 'border-dark-border text-gray-400 hover:border-gray-500'
            }`}
          >
            {f}
            {f !== 'all' && stats[f as keyof typeof stats] > 0 && (
              <span className="ml-1.5 opacity-60">{stats[f as keyof typeof stats]}</span>
            )}
          </button>
        ))}
        <button
          onClick={refresh}
          className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-dark-border text-gray-400 hover:text-white hover:border-gray-500 transition-colors flex items-center gap-1.5"
          title="Refresh tasks"
        >
          <RefreshCw size={11} />
          Refresh
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="text-sm text-red-400 bg-red-900/20 border border-red-700/30 rounded-lg p-3">
          Failed to load tasks: {error}
        </div>
      )}

      {/* Loading state */}
      {loading && !displayTasks.length && (
        <div className="text-center text-gray-500 py-12 text-sm">Loading tasks…</div>
      )}

      {/* Empty state */}
      {!loading && !error && displayTasks.length === 0 && (
        <div className="text-center text-gray-500 py-12 text-sm">
          No tasks found{filter !== 'all' ? ` with status "${filter}"` : ''}.
        </div>
      )}

      {/* Task grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {displayTasks.map(task => (
          <TaskCard key={task.id} task={task} onUpdated={handleUpdated} />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            className="btn-secondary text-sm px-6"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
