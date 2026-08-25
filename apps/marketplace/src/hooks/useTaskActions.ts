"use client";

import { useState, useCallback } from "react";
import { tasksApi, type TaskRecord } from "@/lib/api";

type ActionState = "idle" | "loading" | "success" | "error";

interface ActionHook {
  state: ActionState;
  error: string | null;
  result: TaskRecord | null;
  reset: () => void;
  isLoading: boolean;
  isSuccess: boolean;
}

function useAction(): ActionHook & {
  run: (fn: () => Promise<TaskRecord>) => Promise<TaskRecord | null>;
} {
  const [state, setState] = useState<ActionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TaskRecord | null>(null);

  const run = useCallback(async (fn: () => Promise<TaskRecord>) => {
    setState("loading");
    setError(null);
    try {
      const updated = await fn();
      setResult(updated);
      setState("success");
      return updated;
    } catch (err) {
      setError((err as Error).message);
      setState("error");
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
    setResult(null);
  }, []);

  return {
    state,
    error,
    result,
    reset,
    run,
    isLoading: state === "loading",
    isSuccess: state === "success",
  };
}

/** Open a dispute on a task. Usage: await openDispute(taskId, reason) */
export function useDispute() {
  const action = useAction();
  const openDispute = useCallback(
    (taskId: string, reason: string) => action.run(() => tasksApi.dispute(taskId, reason)),
    [action],
  );
  return { ...action, openDispute };
}

/** Request refund on a timed-out pending task. */
export function useRefund() {
  const action = useAction();
  const requestRefund = useCallback(
    (taskId: string) => action.run(() => tasksApi.refund(taskId)),
    [action],
  );
  return { ...action, requestRefund };
}

/** Complete a running task with a proof hash. */
export function useComplete() {
  const action = useAction();
  const completeTask = useCallback(
    (taskId: string, proofHash: string, latencyMs?: number) =>
      action.run(() => tasksApi.complete(taskId, { proofHash, latencyMs })),
    [action],
  );
  return { ...action, completeTask };
}
