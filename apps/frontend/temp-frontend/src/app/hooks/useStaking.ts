'use client';
import { useState, useEffect, useCallback } from 'react';
import { useWalletCtx } from '@/context/WalletContext';
import { buildCreateTaskTx } from '@/lib/agentbazaar-sdk';

const TOKEN_CONTRACT = process.env.NEXT_PUBLIC_TOKEN_CONTRACT ?? '';

export interface StakingInfo {
  stakedBalance: string;    // in BAZAAR (display)
  feeDiscountBps: number;   // 0 / 1000 / 2500 / 5000
  feeDiscountPct: string;   // "0%" / "10%" / "25%" / "50%"
  tier: 'none' | 'bronze' | 'silver' | 'gold';
}

export function useStaking() {
  const { connected, address, signAndSend } = useWalletCtx();
  const [info,    setInfo]    = useState<StakingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [txHash,  setTxHash]  = useState<string | null>(null);

  // Mock staking info — swap with real contract query when TOKEN_CONTRACT is set
  useEffect(() => {
    if (!connected) { setInfo(null); return; }
    setInfo({
      stakedBalance:  '0.0000',
      feeDiscountBps: 0,
      feeDiscountPct: '0%',
      tier:           'none',
    });
  }, [connected, address]);

  const stake = useCallback(async (amountBazaar: string) => {
    if (!connected) throw new Error('Wallet not connected');
    setLoading(true); setError(null);
    try {
      // stakeForDiscount ESDT call
      // In real impl: build ESDT transfer with data 'ESDTTransfer@<token_hex>@<amount_hex>@stakeForDiscount'
      const hash = await signAndSend({
        receiver: TOKEN_CONTRACT || 'erd1000000000000000000000000000000000000000000000000000000000000',
        value:    '0',
        data:     `ESDTTransfer@${Buffer.from('BAZAAR').toString('hex')}@${BigInt(Math.round(parseFloat(amountBazaar) * 1e18)).toString(16)}@${Buffer.from('stakeForDiscount').toString('hex')}`,
        gasLimit: 10_000_000,
      });
      setTxHash(hash);
      return hash;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [connected, signAndSend]);

  const unstake = useCallback(async (amountBazaar: string) => {
    if (!connected) throw new Error('Wallet not connected');
    setLoading(true); setError(null);
    try {
      const hash = await signAndSend({
        receiver: TOKEN_CONTRACT || 'erd1000000000000000000000000000000000000000000000000000000000000',
        value:    '0',
        data:     `unstake@${BigInt(Math.round(parseFloat(amountBazaar) * 1e18)).toString(16)}`,
        gasLimit: 8_000_000,
      });
      setTxHash(hash);
      return hash;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [connected, signAndSend]);

  return { info, loading, error, txHash, stake, unstake };
}
