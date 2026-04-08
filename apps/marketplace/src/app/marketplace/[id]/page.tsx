"use client";
import { use, useState } from "react";
import Link from "next/link";
import { useServiceDetail } from "@/hooks/useServiceDetail";
import { BuyTaskModal } from "@/components/BuyTaskModal";
import { useWallet } from "@/context/WalletContext";

const CATEGORY_ICONS: Record<string, string> = {
  data:            "📊",
  compute:         "⚙️",
  orchestration:   "🔀",
  compliance:      "🛡️",
  enrichment:      "🔬",
  "wallet-actions": "💳",
  notifications:   "🔔",
  storage:         "💾",
};

type Tab = "overview" | "schema" | "reviews";

export default function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { service, loading, error } = useServiceDetail(id);
  const { connected, openModal } = useWallet();
  const [tab, setTab]         = useState<Tab>("overview");
  const [showBuy, setShowBuy] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm animate-pulse-dot" style={{ color: "var(--color-text-muted)" }}>
          Loading service…
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p style={{ color: "var(--color-danger)" }}>{error ?? "Service not found"}</p>
        <Link href="/marketplace" className="btn-ghost" style={{ display: "inline-block" }}>
          ← Back to Marketplace
        </Link>
      </div>
    );
  }

  const icon = CATEGORY_ICONS[service.category] ?? "🤖";

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
          <Link href="/marketplace" className="hover:underline">Marketplace</Link>
          <span>/</span>
          <span style={{ color: "var(--color-text)" }}>{service.name}</span>
        </nav>

        {/* Hero */}
        <div className="card space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Icon + title */}
            <div
              className="flex items-center justify-center rounded-2xl shrink-0"
              style={{
                width: 72, height: 72,
                background: "var(--color-surface-2)",
                fontSize: 32,
              }}
            >
              {icon}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                  {service.name}
                </h1>
                <span className="badge">{service.category}</span>
                {service.active ? (
                  <span className="badge badge-success">● Active</span>
                ) : (
                  <span className="badge badge-danger">● Inactive</span>
                )}
              </div>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {service.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {service.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "var(--color-surface-2)", color: "var(--color-text-muted)" }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="shrink-0 flex flex-col items-end gap-2">
              <div className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
                {service.price}
              </div>
              <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>per task</div>
              <button
                onClick={() => connected ? setShowBuy(true) : openModal()}
                className="btn-primary"
                style={{ padding: "0.5rem 1.5rem", fontSize: "0.9rem" }}
              >
                {connected ? "Buy Task" : "Connect & Buy"}
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t"
            style={{ borderColor: "var(--color-border)" }}
          >
            {[
              { label: "Reputation Score", value: `${service.score}/100`, color: "var(--color-primary)" },
              { label: "SLA",              value: `${service.slaMs}ms`,   color: "var(--color-success)" },
              { label: "Provider",         value: service.provider.length > 16
                  ? `${service.provider.slice(0, 8)}…${service.provider.slice(-4)}`
                  : service.provider,
                color: "var(--color-text)" },
              { label: "Network",          value: "MultiversX Devnet", color: "var(--color-text-muted)" },
            ].map(({ label, value, color }) => (
              <div key={label} className="space-y-1">
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</div>
                <div className="text-sm font-semibold" style={{ color }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex gap-1 border-b" style={{ borderColor: "var(--color-border)" }}>
            {(["overview", "schema", "reviews"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="tab-btn"
                style={{
                  color: tab === t ? "var(--color-primary)" : "var(--color-text-muted)",
                  borderBottom: tab === t
                    ? "2px solid var(--color-primary)"
                    : "2px solid transparent",
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Overview */}
          {tab === "overview" && (
            <div className="card mt-4 space-y-5">
              <h3 className="font-semibold" style={{ color: "var(--color-text)" }}>How it works</h3>
              <ol className="space-y-3">
                {[
                  `Consumer sends task payload + locks ${service.price} in escrow smart contract.`,
                  `Provider agent receives payload via MCP protocol endpoint.`,
                  `Agent executes, returns proof hash + result within ${service.slaMs}ms SLA.`,
                  "Escrow releases payment to provider automatically. Reputation score updated on-chain.",
                  "If SLA is missed, consumer can claim refund after 5-minute timeout.",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span
                      className="flex items-center justify-center rounded-full shrink-0"
                      style={{
                        width: 24, height: 24, minWidth: 24,
                        background: "var(--color-surface-2)",
                        color: "var(--color-primary)",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ color: "var(--color-text-muted)", lineHeight: 1.6 }}>{step}</span>
                  </li>
                ))}
              </ol>

              {/* Provider card */}
              <div
                className="rounded-xl p-4 space-y-2"
                style={{ background: "var(--color-surface-2)" }}
              >
                <div className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                  PROVIDER
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="rounded-full flex items-center justify-center text-lg"
                    style={{ width: 40, height: 40, background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                  >
                    🤖
                  </div>
                  <div>
                    <div className="text-sm font-mono" style={{ color: "var(--color-text)" }}>
                      {service.provider}
                    </div>
                    <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      MultiversX · Reputation {service.score}/100
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Schema */}
          {tab === "schema" && (
            <div className="card mt-4 space-y-4">
              <div>
                <h3 className="font-semibold mb-3" style={{ color: "var(--color-text)" }}>Input Schema</h3>
                <pre
                  className="text-xs rounded-lg p-4 overflow-x-auto"
                  style={{
                    background: "var(--color-surface-2)",
                    color: "var(--color-text-muted)",
                    border: "1px solid var(--color-border)",
                  }}
                >{
                  JSON.stringify(
                    { type: "object", properties: { query: { type: "string", description: `Input for ${service.name}` } }, required: ["query"] },
                    null, 2
                  )
                }</pre>
              </div>
              <div>
                <h3 className="font-semibold mb-3" style={{ color: "var(--color-text)" }}>Output Schema</h3>
                <pre
                  className="text-xs rounded-lg p-4 overflow-x-auto"
                  style={{
                    background: "var(--color-surface-2)",
                    color: "var(--color-text-muted)",
                    border: "1px solid var(--color-border)",
                  }}
                >{
                  JSON.stringify(
                    { type: "object", properties: { result: { type: "string" }, proofHash: { type: "string" }, latencyMs: { type: "number" } }, required: ["result", "proofHash"] },
                    null, 2
                  )
                }</pre>
              </div>
              <div>
                <h3 className="font-semibold mb-2" style={{ color: "var(--color-text)" }}>MCP Endpoint</h3>
                <div
                  className="text-xs font-mono px-3 py-2 rounded-lg"
                  style={{ background: "var(--color-surface-2)", color: "var(--color-primary)" }}
                >
                  POST /mcp &nbsp;·&nbsp; {"{ jsonrpc: '2.0', method: 'tasks/send', params: {...} }"}
                </div>
              </div>
            </div>
          )}

          {/* Reviews */}
          {tab === "reviews" && (
            <div className="card mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold" style={{ color: "var(--color-text)" }}>On-chain Reviews</h3>
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Powered by Reputation SC</span>
              </div>
              {[
                { address: "erd1abc…def", score: 5, text: "Sub-200ms, exactly as promised. Will use again.",   ago: "2h ago" },
                { address: "erd1xyz…789", score: 5, text: "Reliable and fast. Proof hash verified correctly.",  ago: "1d ago" },
                { address: "erd1mno…pqr", score: 4, text: "Good service, occasional 400ms spikes but overall solid.", ago: "3d ago" },
              ].map((r, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4 space-y-2"
                  style={{ background: "var(--color-surface-2)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>{r.address}</span>
                    <div className="flex items-center gap-2">
                      <span style={{ color: "var(--color-warning)", fontSize: "0.8rem" }}>{"★".repeat(r.score)}</span>
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{r.ago}</span>
                    </div>
                  </div>
                  <p className="text-sm" style={{ color: "var(--color-text)" }}>{r.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sticky Buy CTA */}
        <div
          className="fixed bottom-0 left-0 right-0 z-40 border-t px-6 py-4 flex items-center justify-between"
          style={{
            background: "rgba(14,15,15,0.96)",
            backdropFilter: "blur(12px)",
            borderColor: "var(--color-border)",
          }}
        >
          <div>
            <div className="font-semibold" style={{ color: "var(--color-text)" }}>{service.name}</div>
            <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>SLA {service.slaMs}ms · Score {service.score}/100</div>
          </div>
          <button
            onClick={() => connected ? setShowBuy(true) : openModal()}
            className="btn-primary"
            style={{ padding: "0.6rem 1.75rem" }}
          >
            {connected ? `Buy Task · ${service.price}` : "Connect Wallet"}
          </button>
        </div>
      </div>

      {/* Buy modal */}
      {showBuy && <BuyTaskModal service={service} onClose={() => setShowBuy(false)} />}
    </div>
  );
}
