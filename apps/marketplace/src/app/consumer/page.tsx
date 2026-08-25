"use client";
import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { useMyTasks } from "@/hooks/useMyTasks";
import { TaskActions } from "@/components/tasks/TaskActions";

const MANDATES = [
  { id: "mandate-01", service: "DataFetch Pro",  dailyCap: "0.05 EGLD",  used: "0.012 EGLD", categories: ["data"],    status: "active",  expires: "30d" },
  { id: "mandate-02", service: "ML Compute Node", dailyCap: "0.10 EGLD",  used: "0.045 EGLD", categories: ["compute"], status: "active",  expires: "14d" },
];

export default function ConsumerPage() {
  const { connected, connect, shortAddress } = useWallet();
  const [tab, setTab] = useState<"tasks" | "mandates" | "spending">("tasks");
  const { tasks: TASK_HISTORY, total, loading, error, applyUpdate } = useMyTasks({ limit: 50 });

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="card text-center space-y-4 max-w-sm w-full">
          <div className="text-4xl">🔒</div>
          <h2 className="font-bold text-lg" style={{ color: "var(--color-text)" }}>Connect Wallet</h2>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Connect your xPortal wallet to access the Consumer Dashboard.</p>
          <button onClick={connect} className="btn-primary w-full">Connect xPortal</button>
        </div>
      </div>
    );
  }

  const weiToEgld = (wei: string) => (Number(wei) / 1e18).toFixed(4);
  const totalSpent = TASK_HISTORY.filter(t => t.status === "completed")
    .reduce((acc, t) => acc + Number(t.maxBudget) / 1e18, 0).toFixed(4);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Consumer Dashboard</h1>
          <p className="text-xs mt-1 font-mono" style={{ color: "var(--color-text-muted)" }}>{shortAddress}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Tasks Total", value: String(total || TASK_HISTORY.length) },
            { label: "Completed", value: TASK_HISTORY.filter(t => t.status === "completed").length.toString() },
            { label: "Total Spent", value: `${totalSpent} EGLD` },
            { label: "Active Mandates", value: MANDATES.length.toString() },
          ].map((s) => (
            <div key={s.label} className="card text-center space-y-1">
              <div className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>{s.value}</div>
              <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b" style={{ borderColor: "var(--color-border)" }}>
          {(["tasks", "mandates", "spending"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 text-sm font-medium capitalize transition-colors"
              style={{
                color: tab === t ? "var(--color-primary)" : "var(--color-text-muted)",
                borderBottom: tab === t ? "2px solid var(--color-primary)" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Task History */}
        {tab === "tasks" && (
          <div className="space-y-3">
            {loading && (
              <div className="card text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
                Loading tasks…
              </div>
            )}
            {error && (
              <div className="card text-xs" style={{ color: "var(--color-danger)" }}>
                ⚠ {error} — showing cached data if available.
              </div>
            )}
            {!loading && TASK_HISTORY.length === 0 && (
              <div className="card text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
                No tasks yet. Buy a service from the Marketplace to get started.
              </div>
            )}
            {TASK_HISTORY.map((t) => (
              <div key={t.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs" style={{ color: "var(--color-text-muted)" }}>{t.id}</span>
                    <span className={`badge ${t.status === "completed" || t.status === "refunded" ? "badge-success" : t.status === "pending" || t.status === "running" ? "badge-warning" : "badge-danger"}`}>{t.status}</span>
                    {t.onChainVerified && <span className="badge badge-success">⛓ on-chain</span>}
                  </div>
                  <div className="text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>provider: {t.providerAddress.slice(0, 14)}…</div>
                </div>
                <div className="flex flex-wrap items-center gap-5 text-right text-xs">
                  <div><div style={{ color: "var(--color-primary)" }}>{weiToEgld(t.maxBudget)} EGLD</div><div style={{ color: "var(--color-text-muted)" }}>budget</div></div>
                  <div><div style={{ color: "var(--color-text)" }}>{t.latencyMs != null ? `${t.latencyMs}ms` : "—"}</div><div style={{ color: "var(--color-text-muted)" }}>latency</div></div>
                  <TaskActions task={t} onUpdated={applyUpdate} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mandates */}
        {tab === "mandates" && (
          <div className="space-y-4">
            {MANDATES.map((m) => {
              const usedPct = Math.round((parseFloat(m.used) / parseFloat(m.dailyCap)) * 100);
              return (
                <div key={m.id} className="card space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>{m.service}</span>
                      <span className="ml-2 badge badge-success">● {m.status}</span>
                    </div>
                    <button className="btn-ghost" style={{ padding: "0.25rem 0.75rem", fontSize: "0.75rem", color: "var(--color-danger)", borderColor: "var(--color-danger)" }}>Revoke</button>
                  </div>
                  <div className="flex gap-6 text-xs">
                    <div><span style={{ color: "var(--color-text-muted)" }}>Daily cap: </span><span style={{ color: "var(--color-text)" }}>{m.dailyCap}</span></div>
                    <div><span style={{ color: "var(--color-text-muted)" }}>Used: </span><span style={{ color: "var(--color-primary)" }}>{m.used}</span></div>
                    <div><span style={{ color: "var(--color-text-muted)" }}>Expires: </span><span style={{ color: "var(--color-text)" }}>in {m.expires}</span></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs" style={{ color: "var(--color-text-muted)" }}>
                      <span>Daily spend</span><span>{usedPct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "var(--color-surface-2)" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${usedPct}%`, background: "var(--color-primary)" }} />
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {m.categories.map((c) => <span key={c} className="badge">{c}</span>)}
                  </div>
                </div>
              );
            })}
            <button className="btn-ghost w-full">+ New Mandate</button>
          </div>
        )}

        {/* Spending */}
        {tab === "spending" && (
          <div className="card space-y-4">
            <h3 className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>Spending by Service</h3>
            {[
              { service: "ML Compute Node",  amount: 0.005,  pct: 60 },
              { service: "DataFetch Pro",    amount: 0.001,  pct: 12 },
              { service: "Workflow Runner",  amount: 0.002,  pct: 24 },
              { service: "EGLD Price Oracle", amount: 0.0005, pct: 4 },
            ].map((row) => (
              <div key={row.service} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--color-text)" }}>{row.service}</span>
                  <span style={{ color: "var(--color-primary)" }}>{row.amount} EGLD</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "var(--color-surface-2)" }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${row.pct}%`, background: "var(--color-primary)" }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
