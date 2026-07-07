'use client';

import { useState } from 'react';
import { Clock, Hash, User, Zap, AlertTriangle, RotateCcw } from 'lucide-react';
import { TaskStatusBadge } from './TaskStatusBadge';
import { DisputeModal } from './DisputeModal';
import { useRefund } from '@/hooks/useDispute';
import type { Task } from '@/lib/types';

export function TaskCard({
  task,
  onUpdated,
}: {
  task: Task;
  onUpdated?: (updated: Task) => void;
}) {
  const [showDispute, setShowDispute] = useState(false);
  const [confirmRefund, setConfirmRefund] = useState(false);
  const { requestRefund, isLoading: refunding } = useRefund();

  const deadlinePassed = Date.now() > new Date(task.deadline).getTime();
  const canDispute = ['pending', 'running', 'completed'].includes(task.status);
  const canRefund  = task.status === 'pending' && deadlinePassed;

  const handleRefund = async () => {
    const updated = await requestRefund(task.id);
    if (updated) {
      onUpdated?.(updated);
      setConfirmRefund(false);
    }
  };

  return (
    <>
      <div className="glass rounded-xl p-4 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <TaskStatusBadge status={task.status} />
          <span className="text-xs text-gray-500 font-mono">
            {new Date(task.createdAt).toLocaleTimeString()}
          </span>
        </div>

        {/* Meta */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Hash size={11} />
            <span className="font-mono truncate">{task.id.slice(0, 16)}…</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <User size={11} />
            <span className="font-mono truncate">{task.providerAddress.slice(0, 12)}…</span>
          </div>
          {task.latencyMs !== undefined && (
            <div className="flex items-center gap-2 text-xs text-brand-400">
              <Zap size={11} />
              <span>{task.latencyMs}ms</span>
            </div>
          )}
          {deadlinePassed && task.status === 'pending' && (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <Clock size={11} />
              <span>Deadline passed</span>
            </div>
          )}
        </div>

        {/* Budget / proof row */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
          <span className="text-gray-500">
            Budget: <span className="text-white font-mono">{task.maxBudget}</span>
          </span>
          {task.proofHash && (
            <span className="text-green-400 font-mono truncate max-w-[120px]">
              ✓ {task.proofHash.slice(0, 12)}…
            </span>
          )}
        </div>

        {/* Dispute reason (if already disputed) */}
        {task.status === 'disputed' && task.disputeReason && (
          <p className="text-xs text-orange-300 bg-orange-900/20 border border-orange-700/20 rounded px-2 py-1.5">
            ⚠ {task.disputeReason}
          </p>
        )}

        {/* Action buttons */}
        {(canDispute || canRefund) && (
          <div className="flex gap-2 pt-1">
            {canDispute && (
              <button
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-orange-700/40 text-orange-300 hover:bg-orange-900/30 transition-colors flex-1 justify-center"
                onClick={() => setShowDispute(true)}
              >
                <AlertTriangle size={11} />
                Dispute
              </button>
            )}
            {canRefund && !confirmRefund && (
              <button
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-purple-700/40 text-purple-300 hover:bg-purple-900/30 transition-colors flex-1 justify-center"
                onClick={() => setConfirmRefund(true)}
              >
                <RotateCcw size={11} />
                Refund
              </button>
            )}
            {canRefund && confirmRefund && (
              <div className="flex gap-1.5 flex-1">
                <button
                  className="text-xs px-2 py-1.5 rounded-lg border border-gray-700/40 text-gray-400 hover:bg-gray-800 transition-colors flex-1"
                  onClick={() => setConfirmRefund(false)}
                >
                  Cancel
                </button>
                <button
                  className="text-xs px-2 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white transition-colors flex-1 disabled:opacity-50"
                  disabled={refunding}
                  onClick={handleRefund}
                >
                  {refunding ? 'Processing…' : 'Confirm Refund'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dispute modal */}
      {showDispute && (
        <DisputeModal
          task={task}
          onClose={() => setShowDispute(false)}
          onSuccess={(updated) => {
            onUpdated?.(updated);
            setShowDispute(false);
          }}
        />
      )}
    </>
  );
}
