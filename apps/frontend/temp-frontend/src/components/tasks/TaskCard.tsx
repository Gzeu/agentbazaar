import { Clock, Hash, User, Zap } from 'lucide-react';
import { TaskStatusBadge } from './TaskStatusBadge';
import type { Task } from '@/lib/types';

export function TaskCard({ task }: { task: Task }) {
  return (
    <div className="glass rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <TaskStatusBadge status={task.status} />
        <span className="text-xs text-gray-500 font-mono">
          {new Date(task.createdAt).toLocaleTimeString()}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Hash size={11} />
          <span className="font-mono truncate">{task.id.slice(0, 16)}...</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <User size={11} />
          <span className="font-mono truncate">{task.providerAddress.slice(0, 12)}...</span>
        </div>
        {task.latencyMs && (
          <div className="flex items-center gap-2 text-xs text-brand-400">
            <Zap size={11} />
            <span>{task.latencyMs}ms</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
        <span className="text-gray-500">Budget: <span className="text-white font-mono">{task.maxBudget}</span></span>
        {task.proofHash && (
          <span className="text-green-400 font-mono truncate max-w-[120px]">
            ✓ {task.proofHash.slice(0, 12)}...
          </span>
        )}
      </div>
    </div>
  );
}
