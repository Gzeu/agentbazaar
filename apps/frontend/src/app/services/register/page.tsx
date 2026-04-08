'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

const CATEGORIES = [
  { value: 'data-fetching',   label: 'Data Fetching' },
  { value: 'compute-offload', label: 'Compute Offload' },
  { value: 'wallet-actions',  label: 'Wallet Actions' },
  { value: 'compliance',      label: 'Compliance' },
  { value: 'enrichment',      label: 'Enrichment' },
  { value: 'orchestration',   label: 'Orchestration' },
  { value: 'notifications',   label: 'Notifications' },
];

const PRICING_MODELS = [
  { value: 'per-request', label: 'Per Request' },
  { value: 'per-token',   label: 'Per Token' },
  { value: 'per-action',  label: 'Per Action' },
  { value: 'per-workflow',label: 'Per Workflow' },
  { value: 'subscription',label: 'Subscription' },
];

export default function RegisterServicePage() {
  const [step, setStep] = useState<'form' | 'confirm' | 'done'>('form');
  const [form, setForm] = useState({
    name: '', description: '', category: 'data-fetching',
    endpoint: '', pricingModel: 'per-request', priceAmount: '',
    priceToken: 'EGLD', maxLatencyMs: '', version: '1.0.0',
    ucpCompatible: true, mcpCompatible: true, tags: '',
  });

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('confirm');
  };

  const handleConfirm = () => {
    setStep('done');
  };

  if (step === 'done') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={36} className="text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-dark-text mb-2">Serviciu înregistrat!</h1>
        <p className="text-dark-muted mb-8">Serviciul tău este acum vizibil în marketplace. Agenții îl pot descoperi via UCP și cumpăra via x402/ACP.</p>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5 text-left space-y-2 mb-8">
          <p className="text-xs text-dark-muted">Nume: <span className="text-dark-text font-medium">{form.name}</span></p>
          <p className="text-xs text-dark-muted">Categorie: <span className="text-dark-text">{form.category}</span></p>
          <p className="text-xs text-dark-muted">Preț: <span className="text-brand-400 font-mono">{form.priceAmount} {form.priceToken} / {form.pricingModel}</span></p>
          <p className="text-xs text-dark-muted">Endpoint: <span className="text-dark-text font-mono truncate">{form.endpoint}</span></p>
          <p className="text-xs text-dark-muted">Registry TX: <span className="font-mono text-brand-400">0x{Math.random().toString(16).slice(2,18)}</span></p>
        </div>
        <a href="/services" className="btn-primary">← Înapoi la Marketplace</a>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 animate-fade-in">
        <h1 className="text-xl font-bold text-dark-text mb-6">Confirmă înregistrarea</h1>
        <div className="card space-y-3 mb-6">
          {[
            ['Nume', form.name],
            ['Categorie', form.category],
            ['Endpoint', form.endpoint],
            ['Versiune', form.version],
            ['Preț', `${form.priceAmount} ${form.priceToken} / ${form.pricingModel}`],
            ['Latență max', `${form.maxLatencyMs}ms`],
            ['UCP', form.ucpCompatible ? 'Da' : 'Nu'],
            ['MCP', form.mcpCompatible ? 'Da' : 'Nu'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm border-b border-dark-border/40 pb-2">
              <span className="text-dark-muted">{k}</span>
              <span className="text-dark-text font-medium font-mono truncate max-w-[60%] text-right">{v}</span>
            </div>
          ))}
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-6">
          <p className="text-xs text-amber-400">⚡ Tranzacția va fi trimisă pe MultiversX Supernova. Stake minim necesar: 0.05 EGLD.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => setStep('form')}>← Editează</button>
          <button className="btn-primary flex-1 justify-center" onClick={handleConfirm}>Confirmă & Înregistrează</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-text mb-1">Listează un Serviciu</h1>
        <p className="text-dark-muted text-sm">Înregistrează agentul tău ca provider în AgentBazaar Registry Contract</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card space-y-5">
          <h3 className="section-heading">Informații de bază</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nume serviciu *</label>
              <input className="input" required placeholder="ex: CryptoDataFeed Pro" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="label">Versiune</label>
              <input className="input" placeholder="1.0.0" value={form.version} onChange={e => set('version', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Descriere *</label>
            <textarea className="input min-h-[80px] resize-none" required placeholder="Ce face agentul tău? Ce date/servicii oferă?" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div>
            <label className="label">Categorie *</label>
            <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tags (separate prin virgulă)</label>
            <input className="input" placeholder="defi, realtime, crypto" value={form.tags} onChange={e => set('tags', e.target.value)} />
          </div>
        </div>

        {/* Technical */}
        <div className="card space-y-5">
          <h3 className="section-heading">Configurație tehnică</h3>
          <div>
            <label className="label">Endpoint URL *</label>
            <input className="input" required type="url" placeholder="https://api.myagent.com/v1" value={form.endpoint} onChange={e => set('endpoint', e.target.value)} />
          </div>
          <div>
            <label className="label">Latență maximă (ms) *</label>
            <input className="input" required type="number" min="1" placeholder="500" value={form.maxLatencyMs} onChange={e => set('maxLatencyMs', e.target.value)} />
          </div>
          <div className="flex items-center gap-8">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.ucpCompatible} onChange={e => set('ucpCompatible', e.target.checked)} className="w-4 h-4 accent-teal-500" />
              <span className="text-sm text-dark-text">UCP Compatible</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.mcpCompatible} onChange={e => set('mcpCompatible', e.target.checked)} className="w-4 h-4 accent-teal-500" />
              <span className="text-sm text-dark-text">MCP Compatible</span>
            </label>
          </div>
        </div>

        {/* Pricing */}
        <div className="card space-y-5">
          <h3 className="section-heading">Pricing</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Model preț *</label>
              <select className="input" value={form.pricingModel} onChange={e => set('pricingModel', e.target.value)}>
                {PRICING_MODELS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Preț *</label>
              <input className="input" required type="number" step="0.0001" min="0" placeholder="0.001" value={form.priceAmount} onChange={e => set('priceAmount', e.target.value)} />
            </div>
            <div>
              <label className="label">Token</label>
              <select className="input" value={form.priceToken} onChange={e => set('priceToken', e.target.value)}>
                <option value="EGLD">EGLD</option>
                <option value="USDC">USDC</option>
                <option value="USDT">USDT</option>
              </select>
            </div>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full justify-center py-3 text-base">
          Continuă către confirmare →
        </button>
      </form>
    </div>
  );
}
