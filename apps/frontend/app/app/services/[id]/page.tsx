'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useServices } from '@/hooks/useServices';
import { useWallet } from '@/hooks/useWallet';
import type { Service } from '@/lib/types';

const CATEGORY_COLORS: Record<string, string> = {
  'data': 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  'compute': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  'compliance': 'text-red-400 bg-red-500/10 border-red-500/20',
  'orchestration': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'enrichment': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'wallet-actions': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'notifications': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

function ReputationRing({ score }: { score: number }) {
  const pct = score / 100;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 95 ? '#10b981' : pct >= 80 ? '#14b8a6' : pct >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg width="80" height="80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#1f2937" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <span className="absolute text-sm font-bold font-mono" style={{ color }}>{pct.toFixed(1)}%</span>
    </div>
  );
}

function StatPill({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-dark-surface2 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-dark-muted uppercase tracking-wider">{label}</span>
      <span className="text-lg font-bold font-mono text-dark-text">{value}</span>
      {sub && <span className="text-xs text-dark-muted">{sub}</span>}
    </div>
  );
}

function BuyModal({ service, onClose }: { service: Service; onClose: () => void }) {
  const router = useRouter();
  const { connected, address, connect } = useWallet();
  const [step, setStep] = useState<'quote' | 'mandate' | 'paying' | 'done'>('quote');
  const [payload, setPayload] = useState('{}');
  const [budget, setBudget] = useState(service.priceAmount);
  const [taskId] = useState(() => 'task-' + Math.random().toString(36).slice(2, 8));

  const handlePay = () => {
    if (!connected) { connect(); return; }
    setStep('mandate');
    setTimeout(() => {
      setStep('paying');
      setTimeout(() => setStep('done'), 1800);
    }, 1200);
  };

  if (step === 'done') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-dark-surface rounded-2xl border border-dark-border w-full max-w-sm p-8 text-center animate-slide-up">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h3 className="text-lg font-bold text-dark-text mb-1">Task trimis!</h3>
          <p className="text-xs font-mono text-brand-400 mb-1">TX confirmat pe Supernova</p>
          <p className="text-xs text-dark-muted mb-6">Task ID: <span className="font-mono text-dark-text">{taskId}</span></p>
          <div className="flex gap-3 justify-center">
            <button className="btn-primary" onClick={() => router.push('/tasks')}>Vezi Tasks</button>
            <button className="btn-secondary" onClick={onClose}>Închide</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-dark-surface rounded-2xl border border-dark-border w-full max-w-md p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-dark-text">Cumpără Serviciu</h3>
            <p className="text-xs text-dark-muted mt-0.5">{service.name}</p>
          </div>
          <button className="btn-ghost p-1.5" onClick={onClose}>✕</button>
        </div>

        {/* ACP Flow Stepper */}
        <div className="flex items-center gap-1.5 mb-5">
          {(['quote', 'mandate', 'paying'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 flex-1">
              <div className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold border transition-all ${
                step === s ? 'bg-brand-500 border-brand-500 text-white scale-110'
                : ['mandate', 'paying', 'done'].includes(step) && i < ['quote','mandate','paying'].indexOf(step)
                  ? 'bg-brand-500/20 border-brand-500/40 text-brand-400'
                  : 'bg-dark-surface2 border-dark-border text-dark-muted'
              }`}>{i + 1}</div>
              <span className={`text-xs hidden sm:block ${ step === s ? 'text-dark-text' : 'text-dark-muted' }`}>
                {s === 'quote' ? 'Quote' : s === 'mandate' ? 'AP2 Mandate' : 'x402 Pay'}
              </span>
              {i < 2 && <div className="flex-1 h-px bg-dark-border" />}
            </div>
          ))}
        </div>

        {step === 'quote' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="label">Payload (JSON)</label>
              <textarea className="input h-24 font-mono text-xs resize-none" value={payload} onChange={e => setPayload(e.target.value)} />
            </div>
            <div>
              <label className="label">Budget max (EGLD)</label>
              <input className="input" type="number" step="0.0001" value={budget} onChange={e => setBudget(e.target.value)} />
            </div>
            <div className="bg-dark-surface2 rounded-lg p-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-dark-muted">Preț per {service.pricingModel.replace('per-', '')}</span>
                <span className="font-mono text-dark-text">{service.priceAmount} EGLD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-muted">Latență max</span>
                <span className="font-mono text-dark-text">{service.maxLatencyMs}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-muted">Uptime SLA</span>
                <span className="font-mono text-dark-text">{(service.uptimeGuarantee / 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-muted">Protocol</span>
                <span className="font-mono text-brand-400">UCP → ACP → x402</span>
              </div>
            </div>
            <button className="btn-primary w-full justify-center" onClick={() => setStep('mandate')}>
              Generează Quote →
            </button>
          </div>
        )}

        {step === 'mandate' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-400 mb-1">⚡ AP2 Mandate Verification</p>
              <p className="text-xs text-dark-muted">Verificăm că consumer agent-ul are autorizația necesară pentru această tranzacție în limitele mandatului activ.</p>
            </div>
            <div className="space-y-2">
              {[
                { k: 'Mandate ID', v: 'mnd-' + Math.random().toString(36).slice(2,10), ok: true },
                { k: 'Budget check', v: `${budget} EGLD ≤ limit`, ok: true },
                { k: 'Category allowed', v: service.category, ok: true },
                { k: 'Provider whitelist', v: 'Pass', ok: true },
              ].map(({ k, v, ok }) => (
                <div key={k} className="flex items-center justify-between bg-dark-surface2 rounded-lg px-3 py-2">
                  <span className="text-xs text-dark-muted">{k}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-dark-text">{v}</span>
                    <span className={`text-xs ${ok ? 'text-emerald-400' : 'text-red-400'}`}>{ok ? '✓' : '✗'}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-primary w-full justify-center" onClick={handlePay}>
              {!connected ? '⚡ Connect & Pay' : `Plătește ${service.priceAmount} EGLD via x402`}
            </button>
          </div>
        )}

        {step === 'paying' && (
          <div className="flex flex-col items-center gap-4 py-8 animate-fade-in">
            <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-dark-text">Procesare x402 Payment...</p>
            <p className="text-xs text-dark-muted text-center">Settlement pe MultiversX Supernova<br/>Block time: ~300ms</p>
            <div className="flex gap-2 mt-2">
              {['UCP ✓', 'ACP ✓', 'AP2 ✓', 'x402...'].map((s, i) => (
                <span key={i} className={`text-xs font-mono px-2 py-1 rounded ${
                  s.includes('...') ? 'bg-brand-900/40 text-brand-400 border border-brand-700/30 animate-pulse'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [showBuy, setShowBuy] = useState(false);
  const { services, loading, error } = useServices();
  const service = services.find(s => s.id === id);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-dark-muted">Se încarcă serviciul...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="text-5xl">⚠️</span>
        <h2 className="text-lg font-bold text-dark-text">Eroare la încărcare</h2>
        <p className="text-sm text-dark-muted">{error}</p>
        <button className="btn-secondary" onClick={() => router.push('/')}>← Marketplace</button>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="text-5xl">🤖</span>
        <h2 className="text-lg font-bold text-dark-text">Serviciu negăsit</h2>
        <button className="btn-secondary" onClick={() => router.push('/')}>← Marketplace</button>
      </div>
    );
  }

  return (
    <>
      {showBuy && <BuyModal service={service} onClose={() => setShowBuy(false)} />}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
        {/* Back */}
        <button className="btn-ghost mb-6 -ml-2" onClick={() => router.push('/')}>← Marketplace</button>

        {/* Hero */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`badge border ${CATEGORY_COLORS[service.category] ?? 'text-dark-muted bg-dark-surface2 border-dark-border'}`}>
                  {service.category}
                </span>
                <span className="badge bg-dark-surface2 border border-dark-border text-dark-muted">v{service.version}</span>
                {service.ucpCompatible && <span className="badge bg-brand-900/40 border border-brand-700/30 text-brand-400">UCP</span>}
                {service.mcpCompatible && <span className="badge bg-purple-900/40 border border-purple-700/30 text-purple-400">MCP</span>}
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>
              <h1 className="text-2xl font-bold text-dark-text mb-2">{service.name}</h1>
              <p className="text-dark-muted text-sm leading-relaxed mb-4">{service.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {service.tags.map(t => (
                  <span key={t} className="text-xs font-mono text-dark-muted bg-dark-surface2 border border-dark-border rounded px-2 py-0.5">{t}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <ReputationRing score={service.reputationScore} />
              <span className="text-xs text-dark-muted">Reputation Score</span>
              <button className="btn-primary px-6" onClick={() => setShowBuy(true)}>
                ⚡ Cumpără Acum
              </button>
              <p className="text-xs text-dark-muted font-mono">{service.priceAmount} EGLD / {service.pricingModel.replace('per-', '')}</p>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatPill label="Total Tasks" value={(service.totalTasks / 1000).toFixed(1) + 'K'} sub="all time" />
          <StatPill label="Latență Max" value={service.maxLatencyMs + 'ms'} sub="p99 SLA" />
          <StatPill label="Uptime" value={(service.uptimeGuarantee / 100).toFixed(2) + '%'} sub="garantat" />
          <StatPill label="Preț" value={service.priceAmount + ' EGLD'} sub={service.pricingModel} />
        </div>

        {/* Protocol compatibility */}
        <div className="card mb-6">
          <h3 className="section-heading mb-4">Protocol Compatibility</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { name: 'UCP', desc: 'Discovery', ok: service.ucpCompatible },
              { name: 'ACP', desc: 'Checkout', ok: true },
              { name: 'AP2', desc: 'Mandate', ok: true },
              { name: 'x402', desc: 'Payment', ok: true },
              { name: 'MCP', desc: 'Execution', ok: service.mcpCompatible },
            ].map(({ name, desc, ok }) => (
              <div key={name} className={`rounded-xl p-3 text-center border ${
                ok ? 'bg-brand-500/5 border-brand-500/20' : 'bg-dark-surface2 border-dark-border opacity-50'
              }`}>
                <p className={`text-sm font-bold font-mono ${ok ? 'text-brand-400' : 'text-dark-muted'}`}>{name}</p>
                <p className="text-xs text-dark-muted mt-0.5">{desc}</p>
                <p className={`text-xs mt-1 ${ok ? 'text-emerald-400' : 'text-dark-muted'}`}>{ok ? '✓' : '—'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Provider info */}
        <div className="card">
          <h3 className="section-heading mb-4">Provider Agent</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div>
                <span className="label">Adresă</span>
                <p className="text-xs font-mono text-brand-400 break-all">{service.providerAddress}</p>
              </div>
              <div>
                <span className="label">Endpoint</span>
                <p className="text-xs font-mono text-dark-muted break-all">{service.endpoint}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-dark-muted mb-1">Înregistrat</p>
              <p className="text-sm font-mono text-dark-text">
                {service.createdAt ? new Date(service.createdAt).toLocaleDateString('ro-RO') : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
