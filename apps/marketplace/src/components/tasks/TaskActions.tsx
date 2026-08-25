"use client";

import { useState } from "react";
import { useRefund, useComplete } from "@/hooks/useTaskActions";
import type { TaskRecord } from "@/lib/api";
import { DisputeModal } from "./DisputeModal";

const STATUS_BADGE: Record<string, string> = {
  completed: "badge-success",
  refunded:  "badge-success",
  pending:   "badge-warning",
  running:   "badge-warning",
  disputed:  "badge-danger",
  failed:    "badge-danger",
};

/**
 * Action buttons for a task row, driven by status:
 * - pending (expired) → Refund + Dispute
 * - running           → Complete (proof hash prompt) + Dispute
 */
export function TaskActions({
  task,
  onUpdated,
}: {
  task: TaskRecord;
  onUpdated?: (updated: TaskRecord) => void;
}) {
  const [showDispute, setShowDispute] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const refund = useRefund();

  const canRefund = task.status === "pending";
  const canDispute = ["pending", "running", "completed"].includes(task.status);
  const canComplete = task.status === "running";
  if (!canRefund && !canDispute && !canComplete) return null;

  const handleRefund = async () => {
    if (!confirm("Request refund for this task? Provider will be penalised.")) return;
    const updated = await refund.requestRefund(task.id);
    if (updated) onUpdated?.(updated);
  };

  return (
    <div className="flex items-center gap-2">
      {canComplete && (
        <button className="btn-ghost text-xs" onClick={() => setShowComplete(true)}>
          ✅ Complete
        </button>
      )}
      {canRefund && (
        <button
          className="btn-ghost text-xs disabled:opacity-50"
          style={{ color: "var(--color-primary)" }}
          disabled={refund.isLoading}
          onClick={handleRefund}
        >
          {refund.isLoading ? "Refunding…" : "↩ Refund"}
        </button>
      )}
      {canDispute && (
        <button
          className="btn-ghost text-xs"
          style={{ color: "var(--color-danger)" }}
          onClick={() => setShowDispute(true)}
        >
          ⚠ Dispute
        </button>
      )}
      {refund.error && <span className="text-xs" style={{ color: "var(--color-danger)" }}>{refund.error}</span>}

      {showDispute && (
        <DisputeModal
          task={task}
          onClose={() => setShowDispute(false)}
          onSuccess={onUpdated}
        />
      )}
      {showComplete && (
        <CompleteModal
          task={task}
          onClose={() => setShowComplete(false)}
          onSuccess={onUpdated}
        />
      )}
    </div>
  );
}

function CompleteModal({
  task,
  onClose,
  onSuccess,
}: {
  task: TaskRecord;
  onClose: () => void;
  onSuccess?: (updated: TaskRecord) => void;
}) {
  const complete = useComplete();
  const [proofHash, setProofHash] = useState("");
  const [latency, setLatency] = useState("");

  const handleSubmit = async () => {
    if (!proofHash.trim()) return;
    const updated = await complete.completeTask(
      task.id,
      proofHash.trim(),
      latency ? Number(latency) : undefined,
    );
    if (updated) {
      onSuccess?.(updated);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="card w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm" style={{ color: "var(--color-text)" }}>✅ Complete Task</h2>
          <button onClick={onClose} className="btn-ghost">✕</button>
        </div>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Submit the cryptographic proof of execution. Hash it locally (sha256 of the result) — the escrow releases funds on-chain.
        </p>
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Proof hash</label>
          <input
            className="input mt-1 font-mono text-xs"
            placeholder="0x… or sha256 hex"
            value={proofHash}
            onChange={(e) => setProofHash(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Latency (ms, optional)</label>
          <input
            className="input mt-1"
            type="number"
            min={0}
            value={latency}
            onChange={(e) => setLatency(e.target.value)}
          />
        </div>
        {complete.error && (
          <p className="text-xs rounded px-3 py-2" style={{ color: "var(--color-danger)", background: "rgba(220,38,38,.12)" }}>
            {complete.error}
          </p>
        )}
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose} disabled={complete.isLoading}>Cancel</button>
          <button
            className="btn-primary flex-1 disabled:opacity-50"
            disabled={complete.isLoading || !proofHash.trim()}
            onClick={handleSubmit}
          >
            {complete.isLoading ? "Submitting…" : "Submit Proof"}
          </button>
        </div>
      </div>
    </div>
  );
}
