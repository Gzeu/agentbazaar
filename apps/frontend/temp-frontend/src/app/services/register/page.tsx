'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, ExternalLink, Wallet, AlertCircle } from 'lucide-react';
import { useWalletCtx } from '@/context/WalletContext';

const CATEGORIES = ['data-fetching','compute-offload','orchestration','compliance','enrichment','wallet-actions','notifications','storage','ai-inference','oracle'];
const BACKEND    = process.env.NEXT_PUBLIC_BACKEND_URL   ?? 'http://localhost:3001';
const REGISTRY   = process.env.NEXT_PUBLIC_REGISTRY_CONTRACT ?? '';
const EXPLORER   = process.env.NEXT_PUBLIC_MVX_EXPLORER  ?? 'https://devnet-explorer.multiversx.com';

const DEFAULT_FORM = {
  name: '', description: '', category: 'data-fetching', version: '1.0.0',
  endpoint: '', pricingModel: 'per-call', priceAmount: '', priceToken: 'EGLD',
  maxLatencyMs: 500, uptimeGuarantee: 99,
  ucpCompatible: true, mcpCompatible: true, tags: '',
};

export default function RegisterServicePage() {
  const { connected, address, connect, signAndSend } = useWalletCtx();

  const [form,    setForm]    = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [txHash,  setTxHash]  = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !address) { setError('Connect your wallet first.'); return; }
    setLoading(true); setError(null); setTxHash(null);
    try {
      // 1. Register on-chain via Registry contract
      const nameHex     = Buffer.from(form.name.trim()).toString('hex');
      const endpointHex = Buffer.from(form.endpoint.trim()).toString('hex');
      const priceHex    = BigInt(form.priceAmount || '0').toString(16).padStart(16, '0');
      const hash = await signAndSend({
        receiver: REGISTRY,
        value: '0',
        data: `registerService@${nameHex}@${endpointHex}@${priceHex}`,
        gasLimit: 25_000_000,
      });
      setTxHash(hash);

      // 2. Index in backend (best-effort)
      await fetch(`${BACKEND}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
          maxLatencyMs: Number(form.maxLatencyMs),
          uptimeGuarantee: Number(form.uptimeGuarantee),
          providerAddress: address,
          txHash: hash,
        }),
      }).catch(() => {}); // silent — on-chain is source of truth

      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  /* Success screen */
  if (done) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-4">
      <CheckCircle className="w-16 h-16 text-emerald-400" />
      <h2 className="text-2xl font-bold text-white">Service Registered!</h2>
      <p className="text-gray-400 text-sm text-center max-w-sm">
        Serviciul tău este acum live pe AgentBazaar — on-chain și indexat în marketplace.
      </p>
      {txHash && (
        <a href={`${EXPLORER}/transactions/${txHash}`} target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 text-sm text-brand-400 hover:underline">
          View on devnet explorer <ExternalLink size={13} />
        </a>
      )}
      <div className="flex gap-3 mt-2">
        <Link href="/" className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors">
          View Marketplace
        </Link>
        <button
          onClick={() => { setDone(false); setTxHash(null); setForm(DEFAULT_FORM); }}
          className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-colors">
          Register Another
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-gray-300 flex items-center gap-1">
            <ArrowLeft size={12} /> Marketplace
          </Link>
          <span>/</span>
          <span className="text-white">Register Service</span>
        </nav>

        <div>
          <h1 className="text-2xl font-bold text-white">Register a Service</h1>
          <p className="text-sm text-gray-400 mt-1">
            Listează agentul tău pe marketplace cu escrow on-chain și sistem de reputație.
          </p>
        </div>

        {/* No wallet */}
        {!connected && (
          <div className="glass rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Wallet size={20} className="text-yellow-400" />
              <span className="text-sm text-gray-300">Conectează wallet-ul pentru a semna TX-ul de înregistrare.</span>
            </div>
            <button onClick={connect}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors shrink-0">
              Connect Wallet
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* Connected address */}
        {connected && address && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/3 border border-white/5 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-gray-400">Provider address:</span>
            <a href={`${EXPLORER}/accounts/${address}`} target="_blank" rel="noreferrer"
              className="font-mono text-brand-400 hover:underline flex items-center gap-1">
              {address.slice(0,12)}…{address.slice(-6)}
              <ExternalLink size={10} />
            </a>
          </div>
        )}

        <form onSubmit={submit} className="glass rounded-xl p-6 space-y-5">

          {/* Name + Version */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Service Name *</label>
              <input type="text" required value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. DataFetch Pro"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Version</label>
              <input type="text" value={form.version} onChange={e => set('version', e.target.value)}
                placeholder="1.0.0"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500/50" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Description *</label>
            <textarea required value={form.description} onChange={e => set('description', e.target.value)}
              rows={3} placeholder="Descrie ce face serviciul tău, garanții SLA și cazuri de utilizare."
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500/50 resize-none" />
          </div>

          {/* Endpoint */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">MCP Endpoint URL *</label>
            <input type="url" required value={form.endpoint} onChange={e => set('endpoint', e.target.value)}
              placeholder="https://your-agent.com/mcp"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500/50" />
          </div>

          {/* Category + Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#161b22] border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500/50">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Price (EGLD denomination) *</label>
              <input type="text" required value={form.priceAmount} onChange={e => set('priceAmount', e.target.value)}
                placeholder="1000000000000000 = 0.001 EGLD"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500/50" />
            </div>
          </div>

          {/* SLA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Max Latency (ms)</label>
              <input type="number" value={form.maxLatencyMs} onChange={e => set('maxLatencyMs', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Uptime Guarantee (%)</label>
              <input type="number" min="0" max="100" value={form.uptimeGuarantee} onChange={e => set('uptimeGuarantee', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500/50" />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Tags (comma separated)</label>
            <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)}
              placeholder="realtime, json, fast, cached"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500/50" />
          </div>

          {/* Protocol compat */}
          <div className="flex items-center gap-6">
            {[{ k: 'ucpCompatible', l: 'UCP Compatible' }, { k: 'mcpCompatible', l: 'MCP Compatible' }].map(({ k, l }) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={(form as Record<string, unknown>)[k] as boolean}
                  onChange={e => set(k, e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-500" />
                <span className="text-sm text-gray-300">{l}</span>
              </label>
            ))}
          </div>

          <button type="submit" disabled={loading || !connected}
            className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing & Registering…</>
              : 'Register Service On-Chain'
            }
          </button>
        </form>
      </div>
    </div>
  );
}
