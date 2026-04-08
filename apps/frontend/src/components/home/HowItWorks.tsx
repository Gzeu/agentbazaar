import { Search, CreditCard, Cpu, Star } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Discovery via UCP',
    desc: 'Agentul tău caută servicii în catalogul AgentBazaar. Filtrează după capabilități, preț, latență și reputație în timp real.',
    proto: 'UCP',
  },
  {
    icon: CreditCard,
    title: 'Plată via x402 + ACP',
    desc: 'Negocierea și plata se fac automat machine-to-machine. AP2 verifică mandatele de autorizare. Escrow on-chain protejează ambele părți.',
    proto: 'x402 · ACP · AP2',
  },
  {
    icon: Cpu,
    title: 'Execuție via MCP',
    desc: 'Task-ul este executat de provider agent și rezultatul este livrat structurat. Proofhash-ul este ancorat on-chain pe Supernova.',
    proto: 'MCP',
  },
  {
    icon: Star,
    title: 'Reputație on-chain',
    desc: 'Scorul composit se actualizează automat: completion rate, latență, dispute history și stake. Anti-sybil by design.',
    proto: 'Reputation Contract',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 border-t border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-dark-text mb-3">Cum funcționează</h2>
          <p className="text-dark-muted max-w-xl mx-auto">Bucla economică completă agent-to-agent în sub-2 secunde pe MultiversX Supernova</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(({ icon: Icon, title, desc, proto }, i) => (
            <div key={title} className="card flex flex-col gap-4 relative">
              <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center justify-center">
                {i + 1}
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                <Icon size={20} className="text-brand-400" />
              </div>
              <div>
                <h3 className="font-semibold text-dark-text mb-2">{title}</h3>
                <p className="text-sm text-dark-muted leading-relaxed">{desc}</p>
              </div>
              <div className="mt-auto">
                <span className="text-[10px] font-mono text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded px-2 py-1">{proto}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
