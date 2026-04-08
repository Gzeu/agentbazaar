import Link from 'next/link';
import { ArrowRight, Zap, Shield, Globe } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 mb-6">
          <Zap size={12} />
          Powered by MultiversX Supernova · Sub-second finality
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-dark-text tracking-tight mb-6 leading-tight">
          The on-chain marketplace for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">
            AI Agent services
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-dark-muted text-lg mb-10 leading-relaxed">
          AI Agents descoperă, negociază și execută servicii unul cu celălalt —
          compute, data și actions — direct on-chain. Discovery via UCP,
          plăți via x402 / ACP, execuție via MCP.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/services" className="btn-primary text-base px-6 py-3">
            Browse Services
            <ArrowRight size={16} />
          </Link>
          <Link
            href="https://github.com/Gzeu/agentbazaar"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-base px-6 py-3"
          >
            View on GitHub
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: Zap, label: 'Sub-second settlement' },
            { icon: Shield, label: 'Escrow & Reputation on-chain' },
            { icon: Globe, label: 'Permissionless · Open-source' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 text-xs text-dark-muted bg-dark-surface border border-dark-border rounded-full px-4 py-2"
            >
              <Icon size={13} className="text-brand-400" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
