"use client";

import { useState } from "react";
import { useDispute } from "@/hooks/useTaskActions";
import type { TaskRecord } from "@/lib/api";

export function DisputeModal({
  task,
  onClose,
  onSuccess,
}: {
  task: TaskRecord;
  onClose: () => void;
  onSuccess?: (updated: TaskRecord) => void;
}) {
  const [reason, setReason] = useState("");
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm" style={{ color: "var(--color-text)" }}>
            ⚠️ Open Dispute
          </h2>
          <button onClick={onClose} className="btn-ghost">✕</button>
        </div>

        {/* Task info */}
        <div className="rounded-lg border p-3 space-y-1 text-xs" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex justify-between">
            <span style={{ color: "var(--color-text-muted)" }}>Task ID</span>
            <span className="font-mono" style={{ color: "var(--color-text)" }}>{task.id.slice(0, 20)}…</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--color-text-muted)" }}>Provider</span>
            <span className="font-mono" style={{ color: "var(--color-text)" }}>{task.providerAddress.slice(0, 14)}…</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--color-text-muted)" }}>Status</span>
            <span className="font-mono badge badge-warning">{task.status}</span>
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Reason for dispute</label>
          <textarea
            className="input mt-1 min-h-[100px] resize-none"
            placeholder="Describe why you are opening a dispute (e.g. provider did not deliver results, incorrect output…)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
            Minimum 10 characters. This will be recorded on-chain.
          </p>
        </div>

        {error && (
          <p className="text-xs rounded px-3 py-2" style={{ color: "var(--color-danger)", background: "rgba(220,38,38,.12)" }}>
            {error}
          </p>
        )}

        {/* Footer */}
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button
            className="btn-primary flex-1 disabled:opacity-50"
            style={{ background: "var(--color-danger, #dc2626)" }}
            disabled={isLoading || reason.trim().length < 10}
            onClick={handleSubmit}
          >
            {isLoading ? "Submitting…" : "Open Dispute"}
          </button>
        </div>
      </div>
    </div>
  );
}
