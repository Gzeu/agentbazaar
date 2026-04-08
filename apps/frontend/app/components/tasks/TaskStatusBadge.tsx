import clsx from 'clsx';
import type { TaskStatus } from '@/lib/types';

const STATUS_STYLES: Record<TaskStatus, string> = {
  pending: 'bg-yellow-900/30 text-yellow-300 border-yellow-700/30',
  running: 'bg-blue-900/30 text-blue-300 border-blue-700/30 animate-pulse',
  completed: 'bg-green-900/30 text-green-300 border-green-700/30',
  failed: 'bg-red-900/30 text-red-300 border-red-700/30',
  disputed: 'bg-orange-900/30 text-orange-300 border-orange-700/30',
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={clsx('text-xs px-2 py-0.5 rounded border font-mono', STATUS_STYLES[status])}>
      {status}
    </span>
  );
}
