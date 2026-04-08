'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface WalletCtx {
  connected: boolean;
  address: string | null;
  balance: string | null;
  network: 'devnet' | 'mainnet' | 'testnet';
  connecting: boolean;
  connect: () => void;
  disconnect: () => void;
  signAndSend: (tx: AgentTx) => Promise<string>;
}

export interface AgentTx {
  receiver: string;
  value: string; // in EGLD string e.g. '0.001'
  data?: string;
  gasLimit?: number;
}

const WalletContext = createContext<WalletCtx | null>(null);

// ---------------------------------------------------------------------------
// This provider is a fully functional mock that mirrors the @multiversx/sdk-dapp
// API surface. To upgrade to real wallet:
//   1. npm install @multiversx/sdk-dapp
//   2. Wrap with <DappProvider networkConfig={...}>
//   3. Replace connect() with loginWithExtension() / loginWithWalletConnect()
//   4. Replace signAndSend() with sendTransactions() from sdk-dapp
//   5. Replace balance/address reads with useGetAccountInfo() hook
// The rest of the app consumes WalletContext and needs ZERO changes.
// ---------------------------------------------------------------------------
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Restore in-memory session
  useEffect(() => {
    const w = (globalThis as any).__ab_wallet;
    if (w?.connected) {
      setConnected(true);
      setAddress(w.address);
      setBalance(w.balance);
    }
  }, []);

  const connect = useCallback(() => {
    if (connecting || connected) return;
    setConnecting(true);
    // Simulates wallet popup — replace with sdk-dapp loginWithExtension()
    setTimeout(() => {
      const addr = 'erd1' + Array.from({ length: 58 }, () =>
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join('');
      const bal = (Math.random() * 12 + 0.5).toFixed(4);
      setConnected(true);
      setAddress(addr);
      setBalance(bal);
      setConnecting(false);
      (globalThis as any).__ab_wallet = { connected: true, address: addr, balance: bal };
    }, 1400);
  }, [connecting, connected]);

  const disconnect = useCallback(() => {
    setConnected(false); setAddress(null); setBalance(null);
    delete (globalThis as any).__ab_wallet;
  }, []);

  const signAndSend = useCallback(async (tx: AgentTx): Promise<string> => {
    if (!connected) throw new Error('Wallet not connected');
    // Simulates on-chain TX — replace with sdk-dapp sendTransactions()
    await new Promise(r => setTimeout(r, 900));
    return '0x' + Array.from({ length: 64 }, () =>
      '0123456789abcdef'[Math.floor(Math.random() * 16)]
    ).join('');
  }, [connected]);

  return (
    <WalletContext.Provider value={{ connected, address, balance, network: 'devnet', connecting, connect, disconnect, signAndSend }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletCtx(): WalletCtx {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWalletCtx must be used within WalletProvider');
  return ctx;
}
