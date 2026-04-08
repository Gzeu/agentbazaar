'use client';

import { useState } from 'react';
import { useWalletContext } from '@/context/WalletContext';

export function WalletButton() {
  const { connected, address, balance, connecting, connect, disconnect } = useWalletContext();
  const [open, setOpen] = useState(false);

  if (connecting) {
    return (
      <button disabled className="px-3 py-1.5 rounded-lg bg-brand-700 text-white text-sm font-medium flex items-center gap-2 opacity-80">
        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        Conectare...
      </button>
    );
  }

  if (!connected) {
    return (
      <button
        onClick={() => connect()}
        className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors flex items-center gap-1.5"
      >
        <span className="text-xs">⚡</span> Connect
      </button>
    );
  }

  const short = address ? address.slice(0, 6) + '...' + address.slice(-4) : '';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-surface2 border border-dark-border hover:border-brand-500/40 text-sm transition-all"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-mono text-dark-text text-xs">{short}</span>
        <span className="text-dark-muted text-xs font-mono">{Number(balance).toFixed(2)} EGLD</span>
        <span className="text-dark-muted text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-dark-surface border border-dark-border rounded-xl shadow-lg overflow-hidden z-50 animate-slide-up">
          <div className="px-4 py-3 border-b border-dark-border">
            <p className="text-xs text-dark-muted mb-1">Adresă</p>
            <p className="text-xs font-mono text-brand-400 break-all">{address}</p>
          </div>
          <div className="px-4 py-3 border-b border-dark-border flex justify-between">
            <span className="text-xs text-dark-muted">Balanță</span>
            <span className="text-xs font-mono text-dark-text font-bold">{Number(balance).toFixed(4)} EGLD</span>
          </div>
          <div className="px-4 py-3 flex justify-between">
            <span className="text-xs text-dark-muted">Rețea</span>
            <span className="text-xs font-mono text-emerald-400">Devnet</span>
          </div>
          <div className="px-3 py-2 border-t border-dark-border">
            <button
              onClick={() => { disconnect(); setOpen(false); }}
              className="w-full text-xs text-red-400 hover:text-red-300 py-2 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              Deconectează
            </button>
          </div>
        </div>
      )}

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}
