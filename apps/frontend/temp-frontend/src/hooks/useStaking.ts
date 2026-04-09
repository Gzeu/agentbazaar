'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWalletCtx } from '@/context/WalletContext';

const BACKEND      = process.env.NEXT_PUBLIC_BACKEND_URL   ?? 'http://localhost:3001';
const MVX_API      = process.env.NEXT_PUBLIC_MVX_API       ?? 'https://devnet-api.multiversx.com';
const TOKEN_SC     = process.env.NEXT_PUBLIC_TOKEN_CONTRACT ?? '';
const STAKING_SC   = TOKEN_SC; // staking is handled by token contract

export type StakingTier = 'none' | 'bronze' | 'silver' | 'gold';

export interface StakingInfo {
  stakedBalance: string;   // human BAZAAR
  walletBalance: string;   // human BAZAAR
  feeDiscountPct: string;  // e.g. '25%'
  tier: StakingTier;
  reputationBoost: string; // e.g. '+5%'
  totalStaked: string;     // global
  apy: string;             // e.g. '12.4%'
}

function tierFor(staked: number): StakingTier {
  if (staked >= 10_000) return 'gold';
  if (staked >= 1_000)  return 'silver';
  if (staked >= 100)    return 'bronze';
  return 'none';
}

function discountFor(tier: StakingTier): string {
  return { none: '0%', bronze: '10%', silver: '25%', gold: '50%' }[tier];
}

function reputationBoostFor(tier: StakingTier): string {
  return { none: '+0%', bronze: '+3%', silver: '+5%', gold: '+10%' }[tier];
}

export function useStaking() {
  const { connected, address, signAndSend } = useWalletCtx();

  const [info,    setInfo]    = useState<StakingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [txHash,  setTxHash]  = useState<string | null>(null);

  const fetchInfo = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      // 1. user staked balance from backend
      const stakingRes = await fetch(`${BACKEND}/staking/${address}`).catch(() => null);
      const stakingData = stakingRes?.ok ? await stakingRes.json() : null;

      // 2. BAZAAR token balance from MVX API
      const tokenId  = process.env.NEXT_PUBLIC_BAZAAR_TOKEN_ID ?? 'BAZAAR-devnet';
      const balRes   = await fetch(`${MVX_API}/accounts/${address}/tokens/${tokenId}`).catch(() => null);
      const balData  = balRes?.ok ? await balRes.json() : null;

      // 3. global staking stats
      const globalRes  = await fetch(`${BACKEND}/staking/stats`).catch(() => null);
      const globalData = globalRes?.ok ? await globalRes.json() : null;

      const stakedRaw  = Number(stakingData?.stakedAmount  ?? 0);
      const walletRaw  = Number(balData?.balance           ?? 0) / 1e18;
      const totalRaw   = Number(globalData?.totalStaked    ?? 0);
      const apy        = globalData?.apy ? `${globalData.apy}%` : '—';

      const tier = tierFor(stakedRaw);

      setInfo({
        stakedBalance:   stakedRaw.toFixed(2),
        walletBalance:   walletRaw.toFixed(2),
        feeDiscountPct:  discountFor(tier),
        tier,
        reputationBoost: reputationBoostFor(tier),
        totalStaked:     totalRaw.toFixed(0),
        apy,
      });
    } catch (e) {
      setError('Failed to load staking data.');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (connected && address) fetchInfo();
  }, [connected, address, fetchInfo]);

  const stake = useCallback(async (amount: string) => {
    if (!connected || !amount || !STAKING_SC) return;
    setLoading(true); setError(null); setTxHash(null);
    try {
      const amountHex = BigInt(Math.floor(Number(amount) * 1e18)).toString(16).padStart(2, '0');
      const hash = await signAndSend({
        receiver: STAKING_SC,
        value: '0',
        data: `stake@${amountHex}`,
        gasLimit: 15_000_000,
      });
      setTxHash(hash);
      await fetchInfo();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Stake failed.');
    } finally {
      setLoading(false);
    }
  }, [connected, signAndSend, fetchInfo]);

  const unstake = useCallback(async (amount: string) => {
    if (!connected || !amount || !STAKING_SC) return;
    setLoading(true); setError(null); setTxHash(null);
    try {
      const amountHex = BigInt(Math.floor(Number(amount) * 1e18)).toString(16).padStart(2, '0');
      const hash = await signAndSend({
        receiver: STAKING_SC,
        value: '0',
        data: `unstake@${amountHex}`,
        gasLimit: 15_000_000,
      });
      setTxHash(hash);
      await fetchInfo();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unstake failed.');
    } finally {
      setLoading(false);
    }
  }, [connected, signAndSend, fetchInfo]);

  return { info, loading, error, txHash, stake, unstake, refresh: fetchInfo };
}
