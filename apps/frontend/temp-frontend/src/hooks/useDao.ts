'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWalletCtx } from '@/context/WalletContext';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';
const DAO_SC  = process.env.NEXT_PUBLIC_DAO_CONTRACT ?? '';

export type ProposalStatus = 'active' | 'executed' | 'expired' | 'defeated';

export interface Proposal {
  id: number;
  description: string;
  yesVotes: number;
  noVotes: number;
  quorum: number;
  executed: boolean;
  expiresAt: string;
  createdBy: string;
  txHash?: string;
}

export interface DaoStats {
  totalProposals: number;
  totalVoters: number;
  treasuryEgld: string;
  quorumRequired: number;
}

function statusOf(p: Proposal): ProposalStatus {
  if (p.executed) return 'executed';
  if (new Date(p.expiresAt) < new Date()) {
    return (p.yesVotes > p.noVotes && p.yesVotes >= p.quorum) ? 'defeated' : 'expired';
  }
  return 'active';
}

export function useDao() {
  const { connected, address, signAndSend } = useWalletCtx();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats,     setStats]     = useState<DaoStats | null>(null);
  const [myVotes,   setMyVotes]   = useState<Set<number>>(new Set());
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [txHash,    setTxHash]    = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [propRes, statsRes, votesRes] = await Promise.all([
        fetch(`${BACKEND}/dao/proposals?limit=50`).catch(() => null),
        fetch(`${BACKEND}/dao/stats`).catch(() => null),
        address ? fetch(`${BACKEND}/dao/votes/${address}`).catch(() => null) : Promise.resolve(null),
      ]);
      if (propRes?.ok)  setProposals(await propRes.json());
      if (statsRes?.ok) setStats(await statsRes.json());
      if (votesRes?.ok) {
        const v = await votesRes.json() as number[];
        setMyVotes(new Set(v));
      }
    } catch {
      setError('Could not load DAO data.');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const vote = useCallback(async (proposalId: number, inFavor: boolean) => {
    if (!connected || !DAO_SC) return;
    setError(null); setTxHash(null);
    try {
      const idHex    = proposalId.toString(16).padStart(8, '0');
      const voteHex  = inFavor ? '01' : '00';
      const hash = await signAndSend({
        receiver: DAO_SC,
        value: '0',
        data: `vote@${idHex}@${voteHex}`,
        gasLimit: 10_000_000,
      });
      setTxHash(hash);
      setMyVotes(prev => new Set([...prev, proposalId]));
      // optimistic update
      setProposals(prev => prev.map(p =>
        p.id === proposalId
          ? { ...p, yesVotes: p.yesVotes + (inFavor ? 1000 : 0), noVotes: p.noVotes + (!inFavor ? 1000 : 0) }
          : p
      ));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Vote failed.');
    }
  }, [connected, signAndSend]);

  const createProposal = useCallback(async (description: string, durationDays = 3) => {
    if (!connected || !DAO_SC || !description.trim()) return;
    setError(null); setTxHash(null);
    try {
      const descHex     = Buffer.from(description.trim()).toString('hex');
      const durationSec = (durationDays * 86400).toString(16).padStart(8, '0');
      const hash = await signAndSend({
        receiver: DAO_SC,
        value: '0',
        data: `createProposal@${descHex}@${durationSec}`,
        gasLimit: 20_000_000,
      });
      setTxHash(hash);
      await fetchAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Create proposal failed.');
    }
  }, [connected, signAndSend, fetchAll]);

  return { proposals, stats, myVotes, loading, error, txHash, vote, createProposal, refresh: fetchAll, statusOf };
}
