'use client';

import { createContext, useContext, useState, useCallback, useEffect, PropsWithChildren } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface WalletContextType {
  connected: boolean;
  address: string | null;
  balance: string | null;
  network: 'devnet' | 'testnet' | 'mainnet';
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendTransaction: (params: TxParams) => Promise<TxResult>;
}

export interface TxParams {
  receiver: string;
  value: string;     // in EGLD, e.g. "0.001"
  data?: string;
  gasLimit?: number;
}

export interface TxResult {
  txHash: string;
  status: 'success' | 'pending' | 'fail';
  confirmationMs: number;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const WalletContext = createContext<WalletContextType | null>(null);

export function useWalletContext(): WalletContextType {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWalletContext must be used inside WalletProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
// This implementation uses a mock that mirrors the @multiversx/sdk-dapp interface.
// To switch to the real sdk-dapp:
//   1. npm install @multiversx/sdk-dapp
//   2. Replace the connect() body with: await loginWithExtension() or loginWithWebWallet()
//   3. Replace sendTransaction() with: sendTransactions({ transactions: [tx] })
//   4. Wrap this Provider with <DappProvider network="devnet"> from sdk-dapp
export function WalletProvider({ children }: PropsWithChildren) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress]     = useState<string | null>(null);
  const [balance, setBalance]     = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Restore in-memory session (no localStorage — CSP sandbox)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as any;
    if (w.__ab_addr) { setConnected(true); setAddress(w.__ab_addr); setBalance(w.__ab_bal); }
  }, []);

  const connect = useCallback(async () => {
    if (connected || connecting) return;
    setConnecting(true);
    await new Promise(r => setTimeout(r, 1100)); // simulate wallet modal
    const addr = 'erd1' + Array.from({ length: 58 }, () => '0123456789abcdef'[Math.random() * 16 | 0]).join('');
    const bal  = (Math.random() * 12 + 0.5).toFixed(4);
    setConnected(true); setAddress(addr); setBalance(bal); setConnecting(false);
    if (typeof window !== 'undefined') {
      (window as any).__ab_addr = addr;
      (window as any).__ab_bal  = bal;
    }
  }, [connected, connecting]);

  const disconnect = useCallback(() => {
    setConnected(false); setAddress(null); setBalance(null);
    if (typeof window !== 'undefined') {
      delete (window as any).__ab_addr;
      delete (window as any).__ab_bal;
    }
  }, []);

  // Simulates a MultiversX Supernova transaction (~300ms block time)
  const sendTransaction = useCallback(async (params: TxParams): Promise<TxResult> => {
    if (!connected) throw new Error('Wallet not connected');
    const start = Date.now();
    await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
    return {
      txHash: '0x' + Array.from({ length: 64 }, () => '0123456789abcdef'[Math.random() * 16 | 0]).join(''),
      status: 'success',
      confirmationMs: Date.now() - start,
    };
  }, [connected]);

  return (
    <WalletContext.Provider value={{ connected, address, balance, network: 'devnet', connecting, connect, disconnect, sendTransaction }}>
      {children}
    </WalletContext.Provider>
  );
}
