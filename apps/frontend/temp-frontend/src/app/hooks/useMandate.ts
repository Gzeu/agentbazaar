'use client';
import { useState, useCallback } from 'react';
import { useWalletCtx } from '@/context/WalletContext';

export interface Mandate {
  id: string;
  agentAddress: string;
  allowedCategories: string[];
  dailyCapEGLD: string;
  spentTodayEGLD: string;
  expiresAt: string;
  active: boolean;
}

// Mock mandates — replace with real AP2 contract queries
const MOCK_MANDATES: Mandate[] = [
  {
    id: 'mandate-001',
    agentAddress: 'erd1agent001...',
    allowedCategories: ['data', 'compute'],
    dailyCapEGLD: '0.1',
    spentTodayEGLD: '0.023',
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    active: true,
  },
];

export function useMandate() {
  const { connected } = useWalletCtx();
  const [mandates, setMandates] = useState<Mandate[]>(connected ? MOCK_MANDATES : []);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const createMandate = useCallback(async (opts: Omit<Mandate, 'id' | 'spentTodayEGLD' | 'active'>) => {
    setLoading(true);
    try {
      const mandate: Mandate = {
        ...opts,
        id:             `mandate-${Date.now()}`,
        spentTodayEGLD: '0',
        active:         true,
      };
      setMandates(prev => [...prev, mandate]);
      return mandate;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const revokeMandate = useCallback(async (mandateId: string) => {
    setMandates(prev => prev.map(m => m.id === mandateId ? { ...m, active: false } : m));
  }, []);

  return { mandates, loading, error, createMandate, revokeMandate };
}
