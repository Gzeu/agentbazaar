'use client';

import { useState } from 'react';
import { X, Zap } from 'lucide-react';
import { useSubmitTask } from '@/hooks/useTasks';

export function SubmitTaskModal({
  serviceId = '',
  providerAddress = '',
  onClose,
}: {
  serviceId?: string;
  providerAddress?: string;
  onClose: () => void;
}) {
  const { mutate, isPending } = useSubmitTask();
  const [form, setForm] = useState({
    serviceId,
    consumerId: '',
    providerAddress,
    payload: '{"url": "https://example.com"}',
    maxBudget: '0.01',
    deadlineSeconds: 300,
  });

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    try {
      const parsed = { ...form, payload: JSON.parse(form.payload) };
      mutate(parsed, { onSuccess: onClose });
    } catch {
      alert('Payload must be valid JSON');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-dark-border">
          <h2 className="font-semibold text-dark-text flex items-center gap-2"><Zap size={16} className="text-brand-400" /> Submit Task</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          {[
            { label: 'Service ID', key: 'serviceId' },
            { label: 'Consumer Address (erd1...)', key: 'consumerId' },
            { label: 'Provider Address (erd1...)', key: 'providerAddress' },
            { label: 'Max Budget (EGLD)', key: 'maxBudget' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input className="input" value={(form as any)[key]}
                onChange={(e) => set(key, e.target.value)} />
            </div>
          ))}
          <div>
            <label className="label">Payload (JSON)</label>
            <textarea className="input min-h-[80px] font-mono text-xs resize-none"
              value={form.payload} onChange={(e) => set('payload', e.target.value)} />
          </div>
        </div>
        <div className="p-5 border-t border-dark-border flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" disabled={isPending} onClick={handleSubmit}>
            {isPending ? 'Submitting…' : 'Submit Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
