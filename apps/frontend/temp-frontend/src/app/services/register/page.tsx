'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';

const CATEGORIES = ['data','compute','orchestration','compliance','enrichment','wallet-actions','notifications','storage'];
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export default function RegisterServicePage() {
  const [form, setForm] = useState({
    name: '', description: '', category: 'data', version: '1.0.0',
    endpoint: '', pricingModel: 'per-call', priceAmount: '', priceToken: 'EGLD',
    maxLatencyMs: 500, uptimeGuarantee: 99, stakeAmount: '50000000000000000',
    ucpCompatible: true, mcpCompatible: true, tags: '',
  });
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${BACKEND}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
          maxLatencyMs: Number(form.maxLatencyMs),
          uptimeGuarantee: Number(form.uptimeGuarantee),
          providerAddress: 'erd1placeholder',
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <CheckCircle className="w-16 h-16 text-emerald-400" />
      <h2 className="text-2xl font-bold text-white">Service Registered!</h2>
      <p className="text-gray-400 text-sm text-center">Your service is now live on AgentBazaar.</p>
      <div className="flex gap-3">
        <Link href="/services" className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">View Services</Link>
        <button onClick={() => { setDone(false); setForm(f => ({...f, name:'', description:'', endpoint:'', priceAmount:''})); }} className="px-4 py-2 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20">Register Another</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <nav className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/services" className="hover:text-gray-300 flex items-center gap-1"><ArrowLeft size={12} /> Services</Link>
          <span>/</span><span className="text-white">Register</span>
        </nav>

        <div>
          <h1 className="text-2xl font-bold text-white">Register a Service</h1>
          <p className="text-sm text-gray-400 mt-1">List your agent service on the marketplace with on-chain escrow and reputation.</p>
        </div>

        <form onSubmit={submit} className="glass rounded-xl p-6 space-y-5">
          {[
            { label: 'Service Name', key: 'name', type: 'text', placeholder: 'e.g. DataFetch Pro', required: true },
            { label: 'MCP Endpoint URL', key: 'endpoint', type: 'url', placeholder: 'https://your-agent.com/mcp', required: true },
            { label: 'Price Amount (EGLD denomination)', key: 'priceAmount', type: 'text', placeholder: '1000000000000000 (= 0.001 EGLD)', required: true },
            { label: 'Tags (comma separated)', key: 'tags', type: 'text', placeholder: 'realtime, json, fast' },
          ].map(({ label, key, type, placeholder, required }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
              <input
                type={type} value={(form as Record<string, unknown>)[key] as string}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder} required={required}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500/50"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
            <textarea
              value={form.description} onChange={(e) => set('description', e.target.value)} required
              rows={3} placeholder="Describe what your service does, SLA guarantees, and use cases."
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Category</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#161b22] border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500/50">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Max Latency (ms)</label>
              <input type="number" value={form.maxLatencyMs} onChange={(e) => set('maxLatencyMs', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500/50" />
            </div>
          </div>

          <div className="flex items-center gap-6">
            {[{k:'ucpCompatible',l:'UCP Compatible'},{k:'mcpCompatible',l:'MCP Compatible'}].map(({k,l})=>(
              <label key={k} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={(form as Record<string,unknown>)[k] as boolean} onChange={(e)=>set(k,e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-500" />
                <span className="text-sm text-gray-300">{l}</span>
              </label>
            ))}
          </div>

          {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">⚠ {error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-colors disabled:opacity-50">
            {loading ? 'Registering…' : 'Register Service'}
          </button>
        </form>
      </div>
    </div>
  );
}
