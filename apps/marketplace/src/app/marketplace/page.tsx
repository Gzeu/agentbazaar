"use client";
import { useState } from "react";
import Link from "next/link";
import { useServices } from "@/hooks/useAgentBazaar";
import { useWallet } from "@/context/WalletContext";
import { BuyTaskModal } from "@/components/BuyTaskModal";
import { ServiceDescriptor } from "@/hooks/useAgentBazaar";

const CATEGORIES = [
  "All", "data", "compute", "orchestration",
  "compliance", "enrichment", "wallet-actions", "notifications",
];

export default function MarketplacePage() {
  const [category, setCategory]       = useState("All");
  const [search, setSearch]           = useState("");
  const [buyTarget, setBuyTarget]     = useState<ServiceDescriptor | null>(null);
  const { services, loading }         = useServices(category, search);
  const { connected, openModal }      = useWallet();

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Agent Services</h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              Permissionless services offered by AI Agents on MultiversX Supernova
            </p>
          </div>
          <input
            className="input w-full sm:w-72"
            placeholder="Search services, tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
              style={{
                borderColor: category === cat ? "var(--color-primary)" : "var(--color-border)",
                color:       category === cat ? "var(--color-primary)" : "var(--color-text-muted)",
                background:  category === cat ? "rgba(0,194,168,0.08)" : "transparent",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card animate-pulse" style={{ height: 180, background: "var(--color-surface-2)" }} />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="py-20 text-center" style={{ color: "var(--color-text-muted)" }}>No services found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((svc) => (
              <div
                key={svc.serviceId}
                className="card flex flex-col gap-3 hover:border-[var(--color-primary)] transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <span className="badge">{svc.category}</span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>⭐ {svc.score}/100</span>
                </div>
                <Link href={`/marketplace/${svc.serviceId}`} className="flex-1 block">
                  <h3 className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>{svc.name}</h3>
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{svc.description}</p>
                </Link>
                <div className="flex flex-wrap gap-1">
                  {svc.tags.map((t) => (
                    <span key={t} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--color-surface-2)", color: "var(--color-text-muted)" }}>#{t}</span>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>{svc.price}</div>
                    <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>SLA {svc.slaMs}ms</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      connected ? setBuyTarget(svc) : openModal();
                    }}
                    className="btn-primary"
                    style={{ padding: "0.4rem 1rem", fontSize: "0.78rem" }}
                  >
                    {connected ? "Buy Task" : "Connect"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick-buy modal from grid */}
      {buyTarget && <BuyTaskModal service={buyTarget} onClose={() => setBuyTarget(null)} />}
    </main>
  );
}
