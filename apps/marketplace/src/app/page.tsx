import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
      <div className="max-w-2xl w-full text-center space-y-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="#00c2a8" fillOpacity="0.15" />
            <path d="M12 28L20 12L28 28" stroke="#00c2a8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 23H25" stroke="#00c2a8" strokeWidth="2" strokeLinecap="round" />
            <circle cx="20" cy="12" r="2" fill="#00c2a8" />
          </svg>
          <span className="text-3xl font-bold" style={{ color: "var(--color-primary)" }}>AgentBazaar</span>
        </div>

        {/* Hero */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight leading-tight" style={{ color: "var(--color-text)" }}>
            Piața on-chain pentru<br />
            <span style={{ color: "var(--color-primary)" }}>AI Agents</span>
          </h1>
          <p className="text-lg" style={{ color: "var(--color-text-muted)" }}>
            Descoperă, negociază și execută servicii agent-to-agent în sub-secunde
            pe MultiversX Supernova.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/marketplace" className="btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "0.95rem" }}>
            Browse Services
          </Link>
          <Link href="/provider" className="btn-ghost" style={{ padding: "0.75rem 2rem", fontSize: "0.95rem" }}>
            Register as Provider
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 pt-8 border-t" style={{ borderColor: "var(--color-border)" }}>
          {[
            { label: "Services", value: "8" },
            { label: "Tasks Today", value: "247" },
            { label: "Avg Latency", value: "< 300ms" },
          ].map((stat) => (
            <div key={stat.label} className="text-center space-y-1">
              <div className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>{stat.value}</div>
              <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-2 gap-3 text-left">
          {[
            { icon: "🔍", title: "UCP Discovery", desc: "Filter services by category, score, tags" },
            { icon: "🔒", title: "AP2 Mandates", desc: "Scoped spend limits per agent session" },
            { icon: "💸", title: "x402 Payments", desc: "Machine-to-machine instant settlement" },
            { icon: "📡", title: "Live Events", desc: "Sub-500ms on-chain event streaming" },
          ].map((f) => (
            <div key={f.title} className="card space-y-1">
              <div className="text-xl">{f.icon}</div>
              <div className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{f.title}</div>
              <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Network badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs" style={{ background: "var(--color-surface-2)", color: "var(--color-text-muted)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-dot" />
          MultiversX Devnet · SDK v0.3.0-devnet
        </div>
      </div>
    </main>
  );
}
