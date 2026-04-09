'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWalletCtx } from '@/context/WalletContext';

const BACKEND   = process.env.NEXT_PUBLIC_BACKEND_URL    ?? 'http://localhost:3001';
const ESCROW_SC = process.env.NEXT_PUBLIC_ESCROW_CONTRACT ?? '';
const EXPLORER  = process.env.NEXT_PUBLIC_MVX_EXPLORER   ?? 'https://devnet-explorer.multiversx.com';

export type DisputeStatus = 'open' | 'arbitrating' | 'resolved_consumer' | 'resolved_provider' | 'cancelled';

export interface Dispute {
  id: string;
  taskId: string;
  serviceId?: string;
  serviceName?: string;
  consumerAddress: string;
  providerAddress: string;
  reason: string;
  status: DisputeStatus;
  createdAt: string;
  resolvedAt?: string;
  arbitratorDecision?: string;
  escrowAmount: string;   // smallest EGLD unit
  txHash?: string;
}

export const DISPUTE_EXPLORER = EXPLORER;

export function useDispute() {
  const { connected, address, signAndSend } = useWalletCtx();

  const [disputes,   setDisputes]   = useState<Dispute[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [txHash,     setTxHash]     = useState<string | null>(null);

  const fetchDisputes = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/disputes?address=${address}&limit=20`);
      if (res.ok) {
        const data = await res.json() as Dispute[] | { data?: Dispute[] };
        setDisputes(Array.isArray(data) ? data : (data.data ?? []));
      }
    } catch {
      // silent — list stays empty
    } finally {
      setLoading(false);
    }
  }, [address]);

  // auto-fetch + poll every 15s
  useEffect(() => {
    if (!connected || !address) return;
    fetchDisputes();
    const id = setInterval(fetchDisputes, 15_000);
    return () => clearInterval(id);
  }, [connected, address, fetchDisputes]);

  const openDispute = useCallback(async (taskId: string, reason: string): Promise<string | null> => {
    if (!connected || !ESCROW_SC) {
      setError('Wallet not connected or contract not configured.');
      return null;
    }
    setSubmitting(true); setError(null); setTxHash(null);
    try {
      const taskIdHex = Buffer.from(taskId.trim()).toString('hex');
      const reasonHex = Buffer.from(reason.trim()).toString('hex');
      const hash = await signAndSend({
        receiver: ESCROW_SC,
        value: '0',
        data: `openDispute@${taskIdHex}@${reasonHex}`,
        gasLimit: 15_000_000,
      });
      setTxHash(hash);
      await fetchDisputes();
      return hash;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Transaction failed.');
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [connected, signAndSend, fetchDisputes]);

  return { disputes, loading, submitting, error, txHash, openDispute, refresh: fetchDisputes };
}
