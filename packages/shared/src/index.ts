/**
 * @agentbazaar/shared — shared types & constants used by SDK, apps and backend.
 * Single source of truth for service categories, pricing models, task statuses.
 */

export const SERVICE_CATEGORIES = [
  "data",
  "compute",
  "action",
  "workflow",
  "inference",
  "storage",
  "oracle",
  "compliance",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const PRICING_MODELS = ["fixed", "usage", "subscription", "quote"] as const;
export type PricingModel = (typeof PRICING_MODELS)[number];

export const TASK_STATUSES = ["pending", "running", "completed", "failed", "disputed", "refunded"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const SETTLEMENT_METHODS = ["x402", "acp", "escrow"] as const;
export type SettlementMethod = (typeof SETTLEMENT_METHODS)[number];

export const NETWORKS = ["devnet", "testnet", "mainnet"] as const;
export type Network = (typeof NETWORKS)[number];

export const MIN_STAKE_EGLD = "50000000000000000"; // 0.05 EGLD
export const MARKETPLACE_FEE_BPS = 100; // 1%
export const DISPUTE_WINDOW_SECONDS = 3600;
export const TASK_TIMEOUT_SECONDS = 300;
export const QUOTE_VALIDITY_MS = 60_000;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export function formatEgld(denomination: string, decimals = 4): string {
  const bn = BigInt(denomination);
  const divisor = BigInt(10 ** 18);
  const whole = bn / divisor;
  const frac = bn % divisor;
  const fracStr = frac.toString().padStart(18, "0").slice(0, decimals);
  return `${whole}.${fracStr} EGLD`;
}

export function egldToDenomination(egld: number): string {
  return (BigInt(Math.round(egld * 1e6)) * BigInt(10 ** 12)).toString();
}
