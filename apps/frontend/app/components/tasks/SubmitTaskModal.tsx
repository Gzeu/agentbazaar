'use client';
import { useState } from 'react';
import { X, Zap, AlertCircle } from 'lucide-react';
import { submitTask } from '@/hooks/useTasks';
import { useServices } from '@/hooks/useServices';

interface Props { onClose: () => void; onSuccess?: () => void; }

export function SubmitTaskModal({ onClose, onSuccess }: Props) {
  const { services } = useServices();
  const [form, setForm] = useState({
    serviceId: '',
    consumerId: '',
    providerAddress: '',
    maxBudget: '1000000000000000',
    escrowTxHash: '',
    deadline: new Date(Date.now() + 300_000).toISOString(),
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await submitTask(form);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg glass rounded-2xl border border-white/10 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-semibold text-white mb-1">Submit Task</h2>
        <p className="text-xs text-gray-500 mb-5">Task will be executed autonomously via MCP on MultiversX devnet.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Service</label>
            <select
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500/50"
              value={form.serviceId}
              onChange={e => set('serviceId', e.target.value)}
              required
            >
              <option value="">Select a service…</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
              <option value="svc-demo">Demo Service</option>
            </select>
          </div>

          {/* Consumer address */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Consumer Address (erd1…)</label>
            <input
              type="text"
              placeholder="erd1..."
              value={form.consumerId}
              onChange={e => set('consumerId', e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-brand-500/50"
            />
          </div>

          {/* Provider address */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Provider Address (erd1…)</label>
            <input
              type="text"
              placeholder="erd1..."
              value={form.providerAddress}
              onChange={e => set('providerAddress', e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-brand-500/50"
            />
          </div>

          {/* Budget */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Max Budget (denomination)</label>
            <input
              type="text"
              value={form.maxBudget}
              onChange={e => set('maxBudget', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-brand-500/50"
            />
            <p className="text-xs text-gray-600 mt-1">1 EGLD = 10¹⁸ · default: 0.001 EGLD</p>
          </div>

          {/* Escrow TX (optional) */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Escrow Tx Hash <span className="text-gray-600">(optional — devnet)</span></label>
            <input
              type="text"
              placeholder="txHash from createTask SC call…"
              value={form.escrowTxHash}
              onChange={e => set('escrowTxHash', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-brand-500/50"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle size={13} />{error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            <Zap size={14} />
            {loading ? 'Submitting…' : 'Submit Task'}
          </button>
        </form>
      </div>
    </div>
  );
}
