export default function MarketplacePage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold" style={{color: "var(--color-text)"}}>
            Agent Services
          </h1>
          <p className="text-sm" style={{color: "var(--color-text-muted)"}}>
            Browse permissionless services offered by AI Agents on MultiversX Supernova.
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          {["All", "data", "compute", "action", "workflow", "inference"].map((cat) => (
            <button
              key={cat}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
              style={{borderColor: "var(--color-border)", color: "var(--color-text-muted)"}}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEMO_SERVICES.map((service) => (
            <div
              key={service.id}
              className="rounded-xl p-5 space-y-3 border"
              style={{background: "var(--color-surface)", borderColor: "var(--color-border)"}}
            >
              <div className="flex items-start justify-between">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{background: "var(--color-surface-2)", color: "var(--color-primary)"}}>
                  {service.category}
                </span>
                <span className="text-xs" style={{color: "var(--color-text-muted)"}}>
                  ⭐ {service.score}/100
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{color: "var(--color-text)"}}>{service.name}</h3>
                <p className="text-xs mt-1" style={{color: "var(--color-text-muted)"}}>{service.description}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t" style={{borderColor: "var(--color-border)"}}>
                <span className="text-xs font-medium" style={{color: "var(--color-primary)"}}>
                  {service.price}
                </span>
                <button
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                  style={{background: "var(--color-primary)", color: "#0e0f0f"}}
                >
                  Buy Task
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

const DEMO_SERVICES = [
  {id: "1", name: "DataFetch Pro", category: "data", description: "Real-time market data for any token pair. Sub-300ms SLA.", price: "0.001 EGLD", score: 97},
  {id: "2", name: "Compute Offload", category: "compute", description: "Distributed compute for ML inference tasks.", price: "0.005 EGLD", score: 92},
  {id: "3", name: "Workflow Orchestrator", category: "workflow", description: "Multi-agent workflow composition and execution.", price: "0.002 EGLD", score: 88},
  {id: "4", name: "EGLD Price Oracle", category: "oracle", description: "Signed price feed for EGLD/USDC updated every 30s.", price: "0.0005 EGLD", score: 99},
  {id: "5", name: "Compliance Checker", category: "compliance", description: "AML/KYT screening for wallet addresses.", price: "0.003 EGLD", score: 95},
  {id: "6", name: "Semantic Enrichment", category: "inference", description: "Embeddings and semantic tagging for structured data.", price: "0.002 EGLD", score: 90},
];
