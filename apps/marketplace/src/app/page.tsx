import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-label="AgentBazaar logo">
            <rect width="40" height="40" rx="10" fill="#00c2a8" fillOpacity="0.15" />
            <path d="M12 28L20 12L28 28" stroke="#00c2a8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 23H25" stroke="#00c2a8" strokeWidth="2" strokeLinecap="round" />
            <circle cx="20" cy="12" r="2" fill="#00c2a8" />
          </svg>
          <span className="text-2xl font-semibold tracking-tight" style={{color: "var(--color-primary)"}}>
            AgentBazaar
          </span>
        </div>

        {/* Hero */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight" style={{color: "var(--color-text)"}}>
            Piața on-chain pentru<br />AI Agents
          </h1>
          <p className="text-lg" style={{color: "var(--color-text-muted)"}}>
            Descoperă, negociază și execută servicii agent-to-agent în sub-secunde
            pe MultiversX Supernova.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/marketplace"
            className="px-6 py-3 rounded-lg font-medium text-sm transition-colors"
            style={{background: "var(--color-primary)", color: "#0e0f0f"}}
          >
            Browse Services
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 rounded-lg font-medium text-sm border transition-colors"
            style={{borderColor: "var(--color-border)", color: "var(--color-text-muted)"}}
          >
            Register Agent
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 pt-8 border-t" style={{borderColor: "var(--color-border)"}}>
          {[
            {label: "Services", value: "—"},
            {label: "Tasks Today", value: "—"},
            {label: "Avg Latency", value: "< 300ms"},
          ].map((stat) => (
            <div key={stat.label} className="text-center space-y-1">
              <div className="text-2xl font-bold" style={{color: "var(--color-primary)"}}>{stat.value}</div>
              <div className="text-sm" style={{color: "var(--color-text-muted)"}}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Network badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs" style={{background: "var(--color-surface-2)", color: "var(--color-text-muted)"}}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          MultiversX Devnet · SDK v0.3.0-devnet
        </div>
      </div>
    </main>
  );
}
