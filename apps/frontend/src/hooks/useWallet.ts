'use client';

import { useState, useEffect, useCallback } from 'react';

export interface WalletState {
  connected: boolean;
  address: string | null;
  balance: string | null;
  network: 'devnet' | 'mainnet' | 'testnet';
  connecting: boolean;
  connect: () => void;
  disconnect: () => void;
  signTransaction: (tx: MockTransaction) => Promise<string>;
}

export interface MockTransaction {
  to: string;
  value: string;
  data?: string;
  gasLimit?: number;
}

// Mock wallet hook — ready to replace with @multiversx/sdk-dapp
// When sdk-dapp is installed, swap the internals but keep the same interface.
export function useWallet(): WalletState {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Restore session from memory (no localStorage — sandboxed env)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).__ab_wallet_connected) {
      setConnected(true);
      setAddress((window as any).__ab_wallet_address);
      setBalance((window as any).__ab_wallet_balance);
    }
  }, []);

  const connect = useCallback(() => {
    if (connecting || connected) return;
    setConnecting(true);
    // Simulate wallet popup + signing — replace with sdk-dapp loginWithExtension()
    setTimeout(() => {
      const mockAddr = 'erd1' + Math.random().toString(36).slice(2, 30).padEnd(28, '0').slice(0, 58);
      const mockBalance = (Math.random() * 10 + 0.5).toFixed(4);
      setConnected(true);
      setAddress(mockAddr);
      setBalance(mockBalance);
      setConnecting(false);
      if (typeof window !== 'undefined') {
        (window as any).__ab_wallet_connected = true;
        (window as any).__ab_wallet_address = mockAddr;
        (window as any).__ab_wallet_balance = mockBalance;
      }
    }, 1200);
  }, [connecting, connected]);

  const disconnect = useCallback(() => {
    setConnected(false);
    setAddress(null);
    setBalance(null);
    if (typeof window !== 'undefined') {
      delete (window as any).__ab_wallet_connected;
      delete (window as any).__ab_wallet_address;
      delete (window as any).__ab_wallet_balance;
    }
  }, []);

  const signTransaction = useCallback(async (tx: MockTransaction): Promise<string> => {
    if (!connected) throw new Error('Wallet not connected');
    // Simulate on-chain TX hash — replace with sdk-dapp sendTransactions()
    return new Promise(resolve =>
      setTimeout(() => resolve('0x' + Math.random().toString(16).slice(2, 66)), 800)
    );
  }, [connected]);

  return { connected, address, balance, network: 'devnet', connecting, connect, disconnect, signTransaction };
}
