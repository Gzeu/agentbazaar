'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useDispute } from '@/hooks/useDispute';
import type { Task } from '@/lib/types';

export function DisputeModal({
  task,
  onClose,
  onSuccess,
}: {
  task: Task;
  onClose: () => void;
  onSuccess?: (updated: Task) => void;
}) {
  const [reason, setReason] = useState('');
  const { openDispute, isLoading, error } = useDispute();

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    const updated = await openDispute(task.id, reason);
    if (updated) {
      onSuccess?.(updated);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-md animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-dark-border">
          <h2 className="font-semibold text-dark-text flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-400" />
            Open Dispute
          </h2>
          <button onClick={onClose} className="btn-ghost p-1">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Task info */}
          <div className="bg-dark-border/30 rounded-lg p-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Task ID</span>
              <span className="font-mono text-gray-200">{task.id.slice(0, 20)}…</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Provider</span>
              <span className="font-mono text-gray-200">{task.providerAddress.slice(0, 14)}…</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status</span>
              <span className="font-mono text-orange-300">{task.status}</span>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="label">Reason for dispute</label>
            <textarea
              className="input min-h-[100px] resize-none"
              placeholder="Describe why you are opening a dispute (e.g. provider did not deliver results, incorrect output…)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 10 characters. This will be recorded on-chain.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-900/20 border border-red-700/30 rounded px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-dark-border flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button
            className="btn-primary flex-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-50"
            disabled={isLoading || reason.trim().length < 10}
            onClick={handleSubmit}
          >
            {isLoading ? 'Submitting…' : 'Open Dispute'}
          </button>
        </div>
      </div>
    </div>
  );
}
