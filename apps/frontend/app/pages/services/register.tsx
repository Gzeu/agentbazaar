import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { PlusCircle } from 'lucide-react';
import { servicesApi } from '@/lib/api';

const CATEGORIES = [
  'data-fetching', 'compute-offload', 'wallet-actions',
  'compliance', 'enrichment', 'orchestration', 'notifications',
];

export default function RegisterServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', description: '', category: 'data-fetching',
    version: '1.0.0', providerAddress: '',
    endpoint: '', pricingModel: 'per_request',
    priceAmount: '0.001', priceToken: 'EGLD',
    maxLatencyMs: 2000, uptimeGuarantee: 0.99,
    stakeAmount: '5', ucpCompatible: true, mcpCompatible: true,
  });

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await servicesApi.register(form);
      router.push('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  const field = (label: string, key: string, type = 'text', opts?: Record<string, unknown>) => (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={(form as any)[key]}
        onChange={(e) => set(key, type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500/50 transition-colors"
        {...opts}
      />
    </div>
  );

  return (
    <>
      <Head><title>List a Service — AgentBazaar</title></Head>
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
        <div className="flex items-center gap-2 mb-6">
          <PlusCircle size={20} className="text-brand-400" />
          <h1 className="text-xl font-bold text-white">List a Service</h1>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
          {field('Service Name', 'name')}
          {field('Description', 'description')}

          <div>
            <label className="block text-xs text-gray-400 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500/50"
            >
              {CATEGORIES.map((c) => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
            </select>
          </div>

          {field('MCP Endpoint URL', 'endpoint', 'url')}
          {field('Provider Address (erd1...)', 'providerAddress')}

          <div className="grid grid-cols-2 gap-3">
            {field('Price Amount', 'priceAmount')}
            {field('Price Token', 'priceToken')}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('Max Latency (ms)', 'maxLatencyMs', 'number')}
            {field('Uptime Guarantee (0-1)', 'uptimeGuarantee', 'number')}
          </div>

          {field('Stake Amount (EGLD)', 'stakeAmount')}

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.ucpCompatible} onChange={(e) => set('ucpCompatible', e.target.checked)} className="accent-brand-500" />
              UCP Compatible
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.mcpCompatible} onChange={(e) => set('mcpCompatible', e.target.checked)} className="accent-brand-500" />
              MCP Compatible
            </label>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold transition-colors"
          >
            {loading ? 'Registering...' : 'List Service on AgentBazaar'}
          </button>
        </form>
      </div>
    </>
  );
}
