"use client";
import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import { useProviderDashboard } from "@/hooks/useProviderDashboard";
import type { TaskRecord } from "@/lib/api";

const weiToEgld = (wei: string) => (Number(wei) / 1e18).toFixed(4);

export default function ProviderPage() {
  const { connected, connect, shortAddress, address } = useWallet();
  const [tab, setTab] = useState<"overview" | "services" | "history">("overview");
  const { services, tasks, reputation, stats, loading, error } =
    useProviderDashboard(address);

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="card text-center space-y-4 max-w-sm w-full">
          <div className="text-4xl">🔒</div>
          <h2 className="font-bold text-lg" style={{ color: "var(--color-text)" }}>Connect Wallet</h2>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Connect your xPortal wallet to access the Provider Dashboard.</p>
          <button onClick={connect} className="btn-primary w-full">Connect xPortal</button>
        </div>
      </div>
    );
  }

  const statusBadge = (s: string) =>
    s === "completed" || s === "refunded"
      ? "badge-success"
      : s === "pending" || s === "running"
        ? "badge-warning"
        : "badge-danger";

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Provider Dashboard</h1>
            <p className="text-xs mt-1 font-mono" style={{ color: "var(--color-text-muted)" }}>{shortAddress}</p>
          </div>
          <Link href="/register" className="btn-primary">+ Register Service</Link>
        </div>

        {error && (
          <div className="card text-xs" style={{ color: "var(--color-danger)" }}>⚠ {error}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Active Services", value: String(stats.activeServices) },
            { label: "Total Tasks", value: String(stats.totalTasks) },
            { label: "Total Earned", value: `${stats.earnedEgld} EGLD` },
            { label: "Avg Score", value: stats.avgScore != null ? `${stats.avgScore}/100` : "—" },
          ].map((s) => (
            <div key={s.label} className="card text-center space-y-1">
              <div className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>{s.value}</div>
              <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b" style={{ borderColor: "var(--color-border)" }}>
          {(["overview", "services", "history"] as const).map((t) => (
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

        {loading && (
          <div className="card text-center text-sm" style={{ color: "var(--color-text-muted)" }}>Loading…</div>
        )}

        {/* Overview */}
        {tab === "overview" && !loading && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>My Services</h2>
            {services.length === 0 && (
              <div className="card text-center text-sm space-y-3" style={{ color: "var(--color-text-muted)" }}>
                <p>No registered services yet.</p>
                <Link href="/register" className="btn-primary inline-block">Register your first service</Link>
              </div>
            )}
            {services.map((svc) => (
              <div key={svc.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>{svc.name}</span>
                    <span className="badge">{svc.category}</span>
                    {svc.active && <span className="badge badge-success">● active</span>}
                  </div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{svc.id} · {svc.priceAmount ?? "—"} {svc.priceToken ?? "EGLD"}</div>
                </div>
                <div className="flex gap-6 text-center">
                  <div><div className="text-sm font-bold" style={{ color: "var(--color-text)" }}>{svc.totalTasks ?? 0}</div><div className="text-xs" style={{ color: "var(--color-text-muted)" }}>tasks</div></div>
                  <div><div className="text-sm font-bold" style={{ color: "var(--color-text)" }}>{svc.maxLatencyMs ? `${svc.maxLatencyMs}ms` : "—"}</div><div className="text-xs" style={{ color: "var(--color-text-muted)" }}>max latency</div></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History */}
        {tab === "history" && (
          <div className="space-y-3">
            {tasks.length === 0 && (
              <div className="card text-center text-sm" style={{ color: "var(--color-text-muted)" }}>No incoming tasks yet.</div>
            )}
            {tasks.map((t: TaskRecord) => (
              <div key={t.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs" style={{ color: "var(--color-text-muted)" }}>{t.id}</span>
                    <span className={`badge ${statusBadge(t.status)}`}>{t.status}</span>
                    {t.onChainVerified && <span className="badge badge-success">⛓ on-chain</span>}
                  </div>
                  <div className="text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>consumer: {t.consumerId.slice(0, 14)}…</div>
                </div>
                <div className="flex gap-5 text-right text-xs">
                  <div><div style={{ color: "var(--color-primary)" }}>{weiToEgld(t.maxBudget)} EGLD</div><div style={{ color: "var(--color-text-muted)" }}>budget</div></div>
                  <div><div style={{ color: "var(--color-text)" }}>{t.latencyMs != null ? `${t.latencyMs}ms` : "—"}</div><div style={{ color: "var(--color-text-muted)" }}>latency</div></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Services tab */}
        {tab === "services" && (
          <div className="space-y-3">
            {services.length === 0 && (
              <div className="card text-center text-sm" style={{ color: "var(--color-text-muted)" }}>Nothing here yet — register a service first.</div>
            )}
            {services.map((svc) => (
              <div key={svc.id} className="card flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>{svc.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{svc.id} · {svc.endpoint}</div>
                </div>
                <span className={`badge ${svc.active ? "badge-success" : "badge-danger"}`}>{svc.active ? "active" : "inactive"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
