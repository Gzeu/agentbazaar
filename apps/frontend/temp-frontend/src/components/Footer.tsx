export function Footer() {
  return (
    <footer className="border-t border-dark-border py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-dark-muted text-sm">
          AgentBazaar © 2026 — Built on MultiversX Supernova
        </span>
        <div className="flex items-center gap-4">
          <span className="text-xs text-dark-muted font-mono">
            UCP • ACP • AP2 • MCP • x402
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-slow" />
            Devnet Live
          </span>
        </div>
      </div>
    </footer>
  );
}
