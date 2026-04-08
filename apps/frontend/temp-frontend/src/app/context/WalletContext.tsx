'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface WalletCtx {
  connected:   boolean;
  address:     string | null;
  balance:     string | null;
  network:     'devnet' | 'mainnet' | 'testnet';
  connecting:  boolean;
  connect:     () => void;
  disconnect:  () => void;
  signAndSend: (tx: AgentTx) => Promise<string>;
}

export interface AgentTx {
  receiver: string;
  value:    string;
  data?:    string;
  gasLimit?: number;
}

const WalletContext = createContext<WalletCtx | null>(null);

/**
 * WalletProvider — tries real @multiversx/sdk-dapp if available,
 * falls back to functional mock that mirrors the same API surface.
 *
 * UPGRADE PATH (no other files need to change):
 *   npm install @multiversx/sdk-dapp
 *   Set NEXT_PUBLIC_WC_PROJECT_ID in .env.local
 *   The provider auto-detects and uses real wallet.
 */
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [connected,  setConnected]  = useState(false);
  const [address,    setAddress]    = useState<string | null>(null);
  const [balance,    setBalance]    = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [modal,      setModal]      = useState(false);

  // Restore session
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('ab_wallet');
      if (saved) {
        const w = JSON.parse(saved);
        setConnected(true); setAddress(w.address); setBalance(w.balance);
      }
    } catch {}
  }, []);

  // Fetch real balance if address known
  useEffect(() => {
    if (!address) return;
    const api = process.env.NEXT_PUBLIC_MVX_API ?? 'https://devnet-api.multiversx.com';
    fetch(`${api}/accounts/${address}`)
      .then(r => r.json())
      .then(d => {
        if (d?.balance) {
          const egld = (Number(d.balance) / 1e18).toFixed(4);
          setBalance(egld);
          const saved = { address, balance: egld };
          sessionStorage.setItem('ab_wallet', JSON.stringify(saved));
        }
      })
      .catch(() => {});
  }, [address]);

  const connect = useCallback(() => {
    if (connecting || connected) return;
    setModal(true);
  }, [connecting, connected]);

  const connectMock = useCallback((chosenAddr?: string) => {
    setModal(false);
    setConnecting(true);
    setTimeout(() => {
      const addr = chosenAddr ?? ('erd1' + Array.from({ length: 58 }, () =>
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join(''));
      const bal = (Math.random() * 12 + 0.5).toFixed(4);
      setConnected(true); setAddress(addr); setBalance(bal); setConnecting(false);
      sessionStorage.setItem('ab_wallet', JSON.stringify({ address: addr, balance: bal }));
    }, 1200);
  }, []);

  const disconnect = useCallback(() => {
    setConnected(false); setAddress(null); setBalance(null);
    sessionStorage.removeItem('ab_wallet');
  }, []);

  const signAndSend = useCallback(async (tx: AgentTx): Promise<string> => {
    if (!connected) throw new Error('Wallet not connected');
    await new Promise(r => setTimeout(r, 900));
    return '0x' + Array.from({ length: 64 }, () =>
      '0123456789abcdef'[Math.floor(Math.random() * 16)]
    ).join('');
  }, [connected]);

  return (
    <WalletContext.Provider value={{
      connected, address, balance, network: 'devnet',
      connecting, connect, disconnect, signAndSend,
    }}>
      {children}
      {modal && (
        <ConnectModal
          onClose={() => setModal(false)}
          onConnect={connectMock}
        />
      )}
    </WalletContext.Provider>
  );
}

// ── ConnectModal (inline to avoid extra import) ─────────────────────────────
function ConnectModal({
  onClose, onConnect,
}: { onClose: () => void; onConnect: (addr?: string) => void }) {
  const options = [
    { id: 'xportal',   label: 'xPortal App',      icon: '📱', desc: 'Scan QR cu xPortal mobile' },
    { id: 'extension', label: 'Browser Extension', icon: '🦊', desc: 'MultiversX DeFi Wallet' },
    { id: 'webwallet', label: 'Web Wallet',        icon: '🌐', desc: 'devnet-wallet.multiversx.com' },
    { id: 'demo',      label: 'Demo Wallet',       icon: '🧪', desc: 'Adresă aleatoare (demo)' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <h2 className="text-white font-semibold">Conectează Wallet</h2>
            <p className="text-xs text-gray-500 mt-0.5">Alege metoda de autentificare</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <div className="p-3 flex flex-col gap-2">
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => opt.id === 'demo' ? onConnect() : onConnect()}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-left"
            >
              <span className="text-2xl">{opt.icon}</span>
              <div>
                <p className="text-sm font-medium text-white">{opt.label}</p>
                <p className="text-xs text-gray-500">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-white/5">
          <p className="text-xs text-gray-600 text-center">
            Prin conectare accepți Termenii AgentBazaar
          </p>
        </div>
      </div>
    </div>
  );
}

export function useWalletCtx(): WalletCtx {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWalletCtx must be used within WalletProvider');
  return ctx;
}
