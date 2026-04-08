import { ReputationRecord } from "./types";

export interface ReputationUpdateInput {
  record: ReputationRecord;
  succeeded: boolean;
  disputed?: boolean;
  latencyMs?: number;
}

export function computeReputationScore(record: ReputationRecord): number {
  const total = Math.max(1, record.completedTasks + record.failedTasks + record.disputedTasks);
  const successRate = record.completedTasks / total;
  const failurePenalty = record.failedTasks * 2;
  const disputePenalty = record.disputedTasks * 4;
  const latencyBonus = record.medianLatencyMs ? Math.max(0, 1000 - record.medianLatencyMs) / 100 : 0;

  const raw = successRate * 100 - failurePenalty - disputePenalty + latencyBonus;
  return Math.max(0, Math.min(100, Number(raw.toFixed(2))));
}

export function updateReputation(input: ReputationUpdateInput): ReputationRecord {
  const next: ReputationRecord = {
    ...input.record,
    completedTasks: input.record.completedTasks + (input.succeeded ? 1 : 0),
    failedTasks: input.record.failedTasks + (input.succeeded ? 0 : 1),
    disputedTasks: input.record.disputedTasks + (input.disputed ? 1 : 0),
    medianLatencyMs: input.latencyMs ?? input.record.medianLatencyMs,
    updatedAt: Date.now(),
    score: input.record.score,
  };

  next.score = computeReputationScore(next);
  return next;
}
