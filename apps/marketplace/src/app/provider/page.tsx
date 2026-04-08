"use client";
import { useState } from "react";
import { useWallet } from "@/context/WalletContext";

const ACTIVE_SERVICES = [
  { id: "svc-001", name: "DataFetch Pro",    category: "data",    price: "0.001 EGLD", tasks: 142, earned: "0.142 EGLD", score: 97, status: "active" },
  { id: "svc-007", name: "Wallet Action Bot", category: "wallet-actions", price: "0.0015 EGLD", tasks: 38, earned: "0.057 EGLD", score: 85, status: "active" },
];

const TASK_HISTORY = [
  { id: "task-a1b2", service: "DataFetch Pro",    consumer: "erd1xyz…", status: "completed", amount: "0.001 EGLD",  latency: "210ms", ts: "2m ago" },
  { id: "task-c3d4", service: "DataFetch Pro",    consumer: "erd1abc…", status: "completed", amount: "0.001 EGLD",  latency: "188ms", ts: "5m ago" },
  { id: "task-e5f6", service: "Wallet Action Bot", consumer: "erd1def…", status: "completed", amount: "0.0015 EGLD", latency: "320ms", ts: "12m ago" },
  { id: "task-g7h8", service: "DataFetch Pro",    consumer: "erd1ghi…", status: "disputed",  amount: "0.001 EGLD",  latency: "—",     ts: "1h ago" },
];

export default function ProviderPage() {
  const { connected, connect, shortAddress } = useWallet();
  const [tab, setTab] = useState<"overview" | "services" | "history">("overview");
  const [showRegister, setShowRegister] = useState(false);

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

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Provider Dashboard</h1>
            <p className="text-xs mt-1 font-mono" style={{ color: "var(--color-text-muted)" }}>{shortAddress}</p>
          </div>
          <button onClick={() => setShowRegister(true)} className="btn-primary">+ Register Service</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Active Services", value: "2" },
            { label: "Total Tasks", value: "180" },
            { label: "Total Earned", value: "0.199 EGLD" },
            { label: "Avg Score", value: "91/100" },
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

        {/* Overview */}
        {tab === "overview" && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Active Services</h2>
            {ACTIVE_SERVICES.map((svc) => (
              <div key={svc.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>{svc.name}</span>
                    <span className="badge">{svc.category}</span>
                    <span className="badge badge-success">● active</span>
                  </div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{svc.id} · {svc.price}</div>
                </div>
                <div className="flex gap-6 text-center">
                  <div><div className="text-sm font-bold" style={{ color: "var(--color-text)" }}>{svc.tasks}</div><div className="text-xs" style={{ color: "var(--color-text-muted)" }}>tasks</div></div>
                  <div><div className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>{svc.earned}</div><div className="text-xs" style={{ color: "var(--color-text-muted)" }}>earned</div></div>
                  <div><div className="text-sm font-bold" style={{ color: "var(--color-text)" }}>⭐ {svc.score}</div><div className="text-xs" style={{ color: "var(--color-text-muted)" }}>score</div></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History */}
        {tab === "history" && (
          <div className="space-y-3">
            {TASK_HISTORY.map((t) => (
              <div key={t.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs" style={{ color: "var(--color-text-muted)" }}>{t.id}</span>
                    <span className={`badge ${t.status === "completed" ? "badge-success" : "badge-danger"}`}>{t.status}</span>
                  </div>
                  <div className="text-sm" style={{ color: "var(--color-text)" }}>{t.service}</div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>consumer: {t.consumer}</div>
                </div>
                <div className="flex gap-5 text-right text-xs">
                  <div><div style={{ color: "var(--color-primary)" }}>{t.amount}</div><div style={{ color: "var(--color-text-muted)" }}>amount</div></div>
                  <div><div style={{ color: "var(--color-text)" }}>{t.latency}</div><div style={{ color: "var(--color-text-muted)" }}>latency</div></div>
                  <div><div style={{ color: "var(--color-text-muted)" }}>{t.ts}</div></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Services tab */}
        {tab === "services" && (
          <div className="space-y-3">
            {ACTIVE_SERVICES.map((svc) => (
              <div key={svc.id} className="card flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>{svc.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{svc.id}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-ghost" style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem" }}>Edit</button>
                  <button className="btn-ghost" style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem", color: "var(--color-danger)", borderColor: "var(--color-danger)" }}>Deregister</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Register modal */}
        {showRegister && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setShowRegister(false)}>
            <div className="card w-full max-w-lg space-y-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="font-bold" style={{ color: "var(--color-text)" }}>Register Service</h2>
                <button onClick={() => setShowRegister(false)} style={{ color: "var(--color-text-muted)" }}>✕</button>
              </div>
              {[["Service Name", "text", "DataFetch Pro"], ["Category", "text", "data"], ["Price (EGLD)", "text", "0.001"], ["SLA (ms)", "number", "300"], ["Endpoint URL", "url", "https://…"], ["Tags (comma-separated)", "text", "market,realtime"]].map(([label, type, placeholder]) => (
                <div key={label as string} className="space-y-1">
                  <label className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label as string}</label>
                  <input type={type as string} placeholder={placeholder as string} className="input" />
                </div>
              ))}
              <button className="btn-primary w-full">Register on-chain</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
