'use client';
import type { TaskStatus } from '@/hooks/useTasks';

const MAP: Record<TaskStatus, { label: string; cls: string }> = {
  pending:   { label: 'Pending',   cls: 'bg-gray-500/15   text-gray-400   border-gray-500/20' },
  running:   { label: 'Running',   cls: 'bg-brand-500/15  text-brand-300  border-brand-500/20 animate-pulse' },
  completed: { label: 'Completed', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  failed:    { label: 'Failed',    cls: 'bg-red-500/15    text-red-400    border-red-500/20' },
  disputed:  { label: 'Disputed',  cls: 'bg-yellow-500/15 text-yellow-400  border-yellow-500/20' },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const { label, cls } = MAP[status] ?? MAP.pending;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}
