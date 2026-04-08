'use client';

import { useState } from 'react';
import type { Service, ServiceCategory } from '@/lib/types';

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  'data-fetching':   'Data Fetching',
  'compute-offload': 'Compute Offload',
  'wallet-actions':  'Wallet Actions',
  'compliance':      'Compliance',
  'enrichment':      'Enrichment',
  'orchestration':   'Orchestration',
  'notifications':   'Notifications',
};

const CATEGORY_COLORS: Record<ServiceCategory, string> = {
  'data-fetching':   'bg-teal-500/10 text-teal-400 border-teal-500/20',
  'compute-offload': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'wallet-actions':  'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'compliance':      'bg-red-500/10 text-red-400 border-red-500/20',
  'enrichment':      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'orchestration':   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'notifications':   'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

function CheckoutModal({ service, onClose }: { service: Service; onClose: () => void }) {
  const [step, setStep] = useState<'review' | 'mandate' | 'paying' | 'done'>('review');
  const taskId = Math.random().toString(36).slice(2, 10);

  const handleNext = () => {
    if (step === 'review') setStep('mandate');
    else if (step === 'mandate') {
      setStep('paying');
      setTimeout(() => setStep('done'), 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-dark-border">
          <h2 className="font-semibold text-dark-text">Checkout — {service.name}</h2>
          <button onClick={onClose} className="btn-ghost p-1 text-lg leading-none">&times;</button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-1 mb-6">
            {['review','mandate','paying','done'].map((s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold border flex-shrink-0 ${
                  step === s ? 'bg-brand-500 border-brand-500 text-white'
                  : ['review','mandate','paying','done'].indexOf(step) > i ? 'bg-brand-500/20 border-brand-500/40 text-brand-400'
                  : 'bg-dark-surface2 border-dark-border text-dark-muted'
                }`}>{i + 1}</div>
                {i < 3 && <div className="flex-1 h-px bg-dark-border" />}
              </div>
            ))}
          </div>

          {step === 'review' && (
            <div className="space-y-4">
              <div className="bg-dark-surface2 rounded-lg p-4 space-y-3">
                {[['Serviciu', service.name], ['Model preț', service.pricingModel], ['Latență max', `${service.maxLatencyMs}ms`]].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-dark-muted">{k}</span>
                    <span className="text-dark-text font-medium">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm">
                  <span className="text-dark-muted">Cost</span>
                  <span className="text-brand-400 font-bold font-mono">{service.priceAmount} {service.priceToken}</span>
                </div>
              </div>
              <button className="btn-primary w-full justify-center" onClick={handleNext}>Continuă cu AP2 →</button>
            </div>
          )}

          {step === 'mandate' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-xs text-amber-400 font-medium mb-1">⚡ AP2 Mandate Verification</p>
                <p className="text-xs text-dark-muted">Autorizezi o singură tranzacție în limita bugetului. Escrow on-chain pe Supernova.</p>
              </div>
              <div className="bg-dark-surface2 rounded-lg p-4 space-y-2">
                {[['Tip mandate','Single-use'],['Limită buget',`${service.priceAmount} ${service.priceToken}`],['Protocol','x402 + ACP + MCP']].map(([k,v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-dark-muted">{k}</span>
                    <span className="text-dark-text font-mono">{v}</span>
                  </div>
                ))}
              </div>
              <button className="btn-primary w-full justify-center" onClick={handleNext}>Confirmă & Plătește</button>
            </div>
          )}

          {step === 'paying' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-12 h-12 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-dark-muted">Procesare pe Supernova...</p>
              <p className="text-xs text-brand-400 font-mono animate-pulse">sub-second finality</p>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl text-emerald-400">✓</div>
              <div>
                <p className="font-semibold text-dark-text">Task trimis cu succes!</p>
                <p className="text-xs text-dark-muted mt-1">Confirmat pe MultiversX Supernova</p>
              </div>
              <div className="bg-dark-surface2 rounded-lg p-3 w-full text-left space-y-1.5">
                <p className="text-xs text-dark-muted">Task ID: <span className="font-mono text-brand-400">task-{taskId}</span></p>
                <p className="text-xs text-dark-muted">Protocol: <span className="text-dark-text font-mono">x402 + MCP + AP2</span></p>
                <p className="text-xs text-dark-muted">Finality: <span className="text-emerald-400 font-mono">&lt; 1s</span></p>
              </div>
              <button className="btn-primary w-full justify-center" onClick={onClose}>Închide</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ServiceCard({ service }: { service: Service }) {
  const [showCheckout, setShowCheckout] = useState(false);
  const repPct = Math.round(service.reputationScore / 100);
  const repColor = repPct >= 90 ? 'bg-emerald-400' : repPct >= 70 ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <>
      <div className="card flex flex-col gap-4 group">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-dark-text truncate group-hover:text-brand-400 transition-colors">{service.name}</h3>
            <p className="text-xs text-dark-muted mt-0.5 line-clamp-2">{service.description}</p>
          </div>
          <span className={`badge border flex-shrink-0 ${CATEGORY_COLORS[service.category]}`}>
            {CATEGORY_LABELS[service.category]}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Preț', value: `${service.priceAmount}`, sub: service.priceToken, accent: true },
            { label: 'Latență', value: `${service.maxLatencyMs}ms`, sub: 'max' },
            { label: 'Tasks', value: `${(service.totalTasks/1000).toFixed(1)}K`, sub: 'total' },
          ].map(({ label, value, sub, accent }) => (
            <div key={label} className="bg-dark-surface2 rounded-lg p-2">
              <p className="text-[10px] text-dark-muted">{label}</p>
              <p className={`text-sm font-bold font-mono ${accent ? 'text-brand-400' : 'text-dark-text'}`}>{value}</p>
              <p className="text-[10px] text-dark-muted">{sub}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-dark-muted">Reputație</span>
            <span className="text-xs font-mono text-dark-muted">{repPct}%</span>
          </div>
          <div className="h-1.5 bg-dark-border rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${repColor}`} style={{ width: `${repPct}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {service.ucpCompatible && <span className="text-[10px] font-mono bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded px-1.5 py-0.5">UCP</span>}
          {service.mcpCompatible && <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded px-1.5 py-0.5">MCP</span>}
          {service.tags.slice(0,3).map(t => (
            <span key={t} className="text-[10px] text-dark-muted bg-dark-surface2 border border-dark-border rounded px-1.5 py-0.5">{t}</span>
          ))}
        </div>

        <button className="btn-primary w-full justify-center mt-auto" onClick={() => setShowCheckout(true)}>
          Cumpără Serviciu
        </button>
      </div>

      {showCheckout && <CheckoutModal service={service} onClose={() => setShowCheckout(false)} />}
    </>
  );
}
