'use client';

import { useState } from 'react';
import { useWalletCtx } from '@/context/WalletContext';
import { tasksApi } from '@/lib/api';

export default function DisputePage() {
  const { connected, address } = useWalletCtx();
  const [taskId,  setTaskId]  = useState('');
  const [reason,  setReason]  = useState('');
  const [status,  setStatus]  = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [message, setMessage] = useState('');

  const openDispute = async () => {
    if (!taskId || !reason) return;
    setStatus('loading');
    try {
      // In production: signAndSend(buildOpenDisputeTx(taskId, reason))
      await new Promise(r => setTimeout(r, 1200));
      setStatus('success');
      setMessage(`Disputa deschisă pentru task ${taskId}. Arbitrii vor analiza în 24h.`);
    } catch (e) {
      setStatus('error');
      setMessage((e as Error).message);
    }
  };

  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">⚖️ Dispute Resolution</h1>
        <p className="text-gray-400 text-sm mt-1">
          Deschide o dispută pentru un task nerezolvat. Arbitrii on-chain vor decide câștigătorul.
        </p>
      </div>

      {!connected ? (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-yellow-300 text-sm">
          ⚠️ Conectează wallet-ul pentru a deschide o dispută.
        </div>
      ) : (
        <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-6 flex flex-col gap-5">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Task ID</label>
            <input
              value={taskId}
              onChange={e => setTaskId(e.target.value)}
              placeholder="task-abc12345"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Motiv dispută</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={4}
              placeholder="Descrie problema: task-ul nu a fost completat, output incorect, provider neresponsiv..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">
            <p className="font-semibold mb-1">📋 Procesul de dispută</p>
            <ol className="list-decimal list-inside space-y-0.5 text-blue-300/80">
              <li>Deschizi disputa cu motiv și dovezi</li>
              <li>Provider-ul are 24h să răspundă</li>
              <li>Arbitrii on-chain votează câștigătorul</li>
              <li>Escrow-ul este eliberat conform deciziei</li>
            </ol>
          </div>

          {status === 'success' && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-300 text-sm">
              ✅ {message}
            </div>
          )}
          {status === 'error' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
              ❌ {message}
            </div>
          )}

          <button
            onClick={openDispute}
            disabled={status === 'loading' || !taskId || !reason}
            className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            {status === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Se procesează...
              </span>
            ) : '⚖️ Deschide Dispută'}
          </button>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">Dispute active</h2>
        <div className="text-gray-600 text-sm text-center py-8 border border-white/5 rounded-xl">
          Nicio dispută activă momentan
        </div>
      </div>
    </main>
  );
}
