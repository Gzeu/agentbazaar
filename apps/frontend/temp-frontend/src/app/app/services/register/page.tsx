'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ServiceCategory } from '@/lib/types';

const CATEGORIES: { value: ServiceCategory; label: string }[] = [
  { value: 'data-fetching',   label: 'Data Fetching' },
  { value: 'compute-offload', label: 'Compute Offload' },
  { value: 'wallet-actions',  label: 'Wallet Actions' },
  { value: 'compliance',      label: 'Compliance' },
  { value: 'enrichment',      label: 'Enrichment' },
  { value: 'orchestration',   label: 'Orchestration' },
  { value: 'notifications',   label: 'Notifications' },
];

const PRICING_MODELS = ['per-request', 'per-token', 'per-second', 'per-workflow', 'per-action', 'subscription'];

export default function RegisterServicePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'data-fetching' as ServiceCategory,
    version: '1.0.0',
    endpoint: '',
    pricingModel: 'per-request',
    priceAmount: '',
    priceToken: 'EGLD',
    maxLatencyMs: '500',
    uptimeGuarantee: '9900',
    ucpCompatible: true,
    mcpCompatible: false,
    tags: '',
    stakeAmount: '0.1',
  });

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setDone(true); }, 2000);
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-dark-text mb-2">Serviciu înregistrat!</h1>
        <p className="text-dark-muted mb-2">Contractul Registry a înregistrat serviciul pe MultiversX Supernova.</p>
        <p className="text-xs font-mono text-brand-400 mb-8">TX confirmat în &lt; 1 secundă</p>
        <div className="flex gap-3 justify-center">
          <button className="btn-primary" onClick={() => router.push('/services')}>Vezi Marketplace</button>
          <button className="btn-secondary" onClick={() => { setDone(false); setStep(1); }}>Mai adaugă</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-text mb-1">Înregistrează Serviciu</h1>
        <p className="text-dark-muted text-sm">Publică un serviciu pe AgentBazaar • Registry Contract on-chain</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${
              step === s ? 'bg-brand-500 border-brand-500 text-white'
              : step > s ? 'bg-brand-500/20 border-brand-500/40 text-brand-400'
              : 'bg-dark-surface2 border-dark-border text-dark-muted'
            }`}>{s}</div>
            <span className={`text-xs hidden sm:block ${ step >= s ? 'text-dark-text' : 'text-dark-muted' }`}>
              {s === 1 ? 'Detalii' : s === 2 ? 'Tehnic' : 'Stake & Submit'}
            </span>
            {s < 3 && <div className="flex-1 h-px bg-dark-border" />}
          </div>
        ))}
      </div>

      {/* Step 1 — Basic Info */}
      {step === 1 && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <label className="label">Nume Serviciu *</label>
            <input className="input" placeholder="Ex: CryptoDataFeed Pro" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="label">Descriere *</label>
            <textarea className="input h-24 resize-none" placeholder="Ce face acest serviciu? Ce input/output are?" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Categorie</label>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Versiune</label>
              <input className="input" placeholder="1.0.0" value={form.version} onChange={e => set('version', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Tags (separate prin virgulă)</label>
            <input className="input" placeholder="crypto, realtime, defi" value={form.tags} onChange={e => set('tags', e.target.value)} />
          </div>
          <button className="btn-primary w-full justify-center" disabled={!form.name || !form.description} onClick={() => setStep(2)}>Continuă →</button>
        </div>
      )}

      {/* Step 2 — Technical */}
      {step === 2 && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <label className="label">Endpoint URL *</label>
            <input className="input" placeholder="https://api.myagent.xyz/v1" value={form.endpoint} onChange={e => set('endpoint', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Model Prețuri</label>
              <select className="input" value={form.pricingModel} onChange={e => set('pricingModel', e.target.value)}>
                {PRICING_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Preț per unitate (EGLD)</label>
              <input className="input" placeholder="0.001" type="number" step="0.0001" value={form.priceAmount} onChange={e => set('priceAmount', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Latență Max (ms)</label>
              <input className="input" type="number" value={form.maxLatencyMs} onChange={e => set('maxLatencyMs', e.target.value)} />
            </div>
            <div>
              <label className="label">Uptime Garantat (bps)</label>
              <input className="input" type="number" max="10000" value={form.uptimeGuarantee} onChange={e => set('uptimeGuarantee', e.target.value)} />
              <p className="text-xs text-dark-muted mt-1">9900 = 99.00%</p>
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-teal-500" checked={form.ucpCompatible} onChange={e => set('ucpCompatible', e.target.checked)} />
              <span className="text-sm text-dark-text">UCP Compatible</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-teal-500" checked={form.mcpCompatible} onChange={e => set('mcpCompatible', e.target.checked)} />
              <span className="text-sm text-dark-text">MCP Compatible</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary" onClick={() => setStep(1)}>← Înapoi</button>
            <button className="btn-primary flex-1 justify-center" disabled={!form.endpoint || !form.priceAmount} onClick={() => setStep(3)}>Continuă →</button>
          </div>
        </div>
      )}

      {/* Step 3 — Stake & Submit */}
      {step === 3 && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-amber-400 mb-2">⚡ Stake obligatoriu</h3>
            <p className="text-xs text-dark-muted">Staking-ul asigură comportamentul corect. Fondurile pot fi slashed în caz de fraudă sau non-delivery.</p>
          </div>
          <div>
            <label className="label">Stake Amount (EGLD)</label>
            <input className="input" type="number" step="0.01" value={form.stakeAmount} onChange={e => set('stakeAmount', e.target.value)} />
          </div>

          {/* Summary */}
          <div className="bg-dark-surface2 rounded-xl p-4 space-y-2">
            <p className="text-xs text-dark-muted uppercase tracking-wider mb-3">Rezumat</p>
            {[
              ['Serviciu', form.name],
              ['Categorie', form.category],
              ['Endpoint', form.endpoint],
              ['Preț', `${form.priceAmount} EGLD / ${form.pricingModel}`],
              ['Latență Max', `${form.maxLatencyMs}ms`],
              ['Stake', `${form.stakeAmount} EGLD`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-dark-muted">{k}</span>
                <span className="text-dark-text font-mono truncate max-w-[200px]">{v}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button className="btn-secondary" onClick={() => setStep(2)}>← Înapoi</button>
            <button
              className="btn-primary flex-1 justify-center"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Procesare...</>
              ) : '🚀 Înregistrează pe Supernova'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
