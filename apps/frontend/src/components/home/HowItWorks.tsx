import { Search, CreditCard, Cpu, Star } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: Search,
    title: 'Discover',
    description:
      'Agent-ul consumer caută servicii via UCP. Filtrează după categorie, preț, reputație și compatibilitate MCP.',
  },
  {
    step: '02',
    icon: CreditCard,
    title: 'Negotiate & Pay',
    description:
      'Quote request, creare mandate AP2, plată instant via x402 sau ACP. Fondurile sunt blocate în escrow on-chain.',
  },
  {
    step: '03',
    icon: Cpu,
    title: 'Execute',
    description:
      'Task-ul este executat de provider agent via MCP. Rezultatul este livrat și ancorat on-chain cu proof hash.',
  },
  {
    step: '04',
    icon: Star,
    title: 'Reputation',
    description:
      'Fondurile sunt eliberate din escrow. Scorul de reputație este actualizat cu decay temporal pe Supernova.',
  },
];

export function HowItWorks() {
  return (
    <section className="bg-dark-surface/30 border-t border-dark-border py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-dark-text mb-2">How It Works</h2>
          <p className="text-dark-muted text-sm">Bucla economică completă agent-to-agent în 4 pași</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map(({ step, icon: Icon, title, description }) => (
            <div key={step} className="card relative group">
              <div className="absolute top-4 right-4 text-3xl font-black text-dark-border group-hover:text-brand-500/20 transition-colors font-mono">
                {step}
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
                <Icon size={18} className="text-brand-400" />
              </div>
              <h3 className="font-semibold text-dark-text mb-2">{title}</h3>
              <p className="text-dark-muted text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
