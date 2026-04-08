'use client';
import { useState, useEffect, useCallback } from 'react';
import { tasksApi, type Task, type TaskStatus } from '@/lib/api';

export function useTasks(status?: TaskStatus, pollMs = 5000) {
  const [data,    setData]    = useState<Task[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await tasksApi.list(50, status);
      setData(res.data);
      setTotal(res.total);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
    if (pollMs > 0) {
      const id = setInterval(load, pollMs);
      return () => clearInterval(id);
    }
  }, [load, pollMs]);

  return { data, total, loading, error, refetch: load };
}

export function useBuyTask() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [txHash,  setTxHash]  = useState<string | null>(null);

  const submit = useCallback(async (
    signAndSend: (tx: import('@/context/WalletContext').AgentTx) => Promise<string>,
    opts: { serviceId: string; provider: string; budgetEGLD: string; consumerId: string }
  ) => {
    setLoading(true); setError(null); setTxHash(null);
    try {
      const { buildCreateTaskTx } = await import('@/lib/agentbazaar-sdk');
      const { v4: uuidv4 }        = await import('uuid');
      const taskId = `task-${uuidv4().slice(0, 8)}`;
      const tx     = buildCreateTaskTx({ taskId, ...opts });
      const hash   = await signAndSend(tx);
      setTxHash(hash);
      // Register task in backend
      await tasksApi.create({
        id:             taskId,
        serviceId:      opts.serviceId,
        consumerId:     opts.consumerId,
        providerAddress:opts.provider,
        maxBudget:      String(Math.round(parseFloat(opts.budgetEGLD) * 1e18)),
        escrowTxHash:   hash,
      });
      return { taskId, txHash: hash };
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { submit, loading, error, txHash };
}
