'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useRegisterService } from '@/hooks/useServices';

export function RegisterServiceModal({ onClose }: { onClose: () => void }) {
  const { mutate, isPending } = useRegisterService();
  const [form, setForm] = useState({
    name: '', description: '', category: 'data-fetching', version: '1.0.0',
    providerAddress: '', endpoint: '', pricingModel: 'per_request',
    priceAmount: '0.001', priceToken: 'EGLD',
    maxLatencyMs: 2000, uptimeGuarantee: 0.99,
    stakeAmount: '5', ucpCompatible: true, mcpCompatible: true,
  });

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-dark-border">
          <h2 className="font-semibold text-dark-text">Register Service</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          {[
            { label: 'Service Name', key: 'name', type: 'text', placeholder: 'e.g. Premium Web Data Fetcher' },
            { label: 'Description', key: 'description', type: 'text', placeholder: 'What does this service do?' },
            { label: 'Provider Address (erd1...)', key: 'providerAddress', type: 'text', placeholder: 'erd1...' },
            { label: 'Endpoint (MCP URL)', key: 'endpoint', type: 'text', placeholder: 'https://...' },
            { label: 'Price Amount', key: 'priceAmount', type: 'text', placeholder: '0.001' },
            { label: 'Stake Amount (EGLD)', key: 'stakeAmount', type: 'text', placeholder: '5' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input className="input" type={type} placeholder={placeholder}
                value={(form as any)[key]} onChange={(e) => set(key, e.target.value)} />
            </div>
          ))}

          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {['data-fetching','compute-offload','wallet-actions','compliance','enrichment','orchestration','notifications']
                .map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-brand-500" checked={form.ucpCompatible}
                onChange={(e) => set('ucpCompatible', e.target.checked)} />
              <span className="text-sm text-dark-muted">UCP</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-brand-500" checked={form.mcpCompatible}
                onChange={(e) => set('mcpCompatible', e.target.checked)} />
              <span className="text-sm text-dark-muted">MCP</span>
            </label>
          </div>
        </div>
        <div className="p-5 border-t border-dark-border flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" disabled={isPending}
            onClick={() => mutate(form as any, { onSuccess: onClose })}>
            {isPending ? 'Registering…' : 'Register Service'}
          </button>
        </div>
      </div>
    </div>
  );
}
