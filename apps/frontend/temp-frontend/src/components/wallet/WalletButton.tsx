'use client';

import { useState, useRef, useEffect } from 'react';
import { useWalletCtx } from '@/context/WalletContext';

export function WalletButton() {
  const { connected, address, balance, connecting, connect, disconnect, network } = useWalletCtx();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (connecting) {
    return (
      <button disabled className="px-3 py-1.5 rounded-lg bg-brand-600/50 text-white text-sm font-medium flex items-center gap-2">
        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        Conectare...
      </button>
    );
  }

  if (!connected) {
    return (
      <button onClick={connect} className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors flex items-center gap-1.5">
        <span className="text-xs">⚡</span>
        Connect Wallet
      </button>
    );
  }

  const short = address ? address.slice(0, 6) + '...' + address.slice(-4) : '';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-surface2 hover:bg-dark-border text-dark-text text-sm font-medium border border-dark-border transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="font-mono">{short}</span>
        <span className="text-dark-muted text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-dark-surface border border-dark-border rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-dark-border">
            <p className="text-xs text-dark-muted mb-1">Adresă conectată</p>
            <p className="text-xs font-mono text-brand-400 break-all">{address}</p>
          </div>
          <div className="p-4 border-b border-dark-border">
            <div className="flex justify-between">
              <span className="text-xs text-dark-muted">Balanță</span>
              <span className="text-sm font-bold font-mono text-dark-text">{balance} EGLD</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-dark-muted">Rețea</span>
              <span className="text-xs font-mono text-emerald-400">{network}</span>
            </div>
          </div>
          <div className="p-2">
            <button
              onClick={() => { disconnect(); setOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              🔌 Deconectează
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
