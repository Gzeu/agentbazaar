'use client';

import { useState, useCallback } from 'react';
import { tasksApi } from '@/lib/api';
import type { Task } from '@/lib/types';

type ActionState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Hook to open a dispute on a task.
 *
 * Usage:
 *   const { openDispute, state, error } = useDispute();
 *   const updated = await openDispute(taskId, 'Provider did not deliver results');
 */
export function useDispute() {
  const [state, setState]   = useState<ActionState>('idle');
  const [error, setError]   = useState<string | null>(null);
  const [result, setResult] = useState<Task | null>(null);

  const openDispute = useCallback(async (
    taskId: string,
    reason: string,
  ): Promise<Task | null> => {
    if (!taskId || !reason.trim()) {
      setError('Task ID and reason are required');
      setState('error');
      return null;
    }
    setState('loading');
    setError(null);
    try {
      const updated = await tasksApi.dispute(taskId, reason);
      setResult(updated);
      setState('success');
      return updated;
    } catch (err) {
      setError((err as Error).message);
      setState('error');
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setError(null);
    setResult(null);
  }, []);

  return {
    openDispute,
    state,
    error,
    result,
    reset,
    isLoading: state === 'loading',
    isSuccess: state === 'success',
  };
}

/**
 * Hook to request a refund on a timed-out task.
 *
 * Usage:
 *   const { requestRefund, isLoading, error } = useRefund();
 *   await requestRefund(taskId);
 */
export function useRefund() {
  const [state, setState] = useState<ActionState>('idle');
  const [error, setError] = useState<string | null>(null);

  const requestRefund = useCallback(async (taskId: string): Promise<Task | null> => {
    setState('loading');
    setError(null);
    try {
      const updated = await tasksApi.refund(taskId);
      setState('success');
      return updated;
    } catch (err) {
      setError((err as Error).message);
      setState('error');
      return null;
    }
  }, []);

  const reset = useCallback(() => { setState('idle'); setError(null); }, []);

  return {
    requestRefund,
    state,
    error,
    reset,
    isLoading: state === 'loading',
    isSuccess: state === 'success',
  };
}
