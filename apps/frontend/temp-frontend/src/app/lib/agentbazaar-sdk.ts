/**
 * AgentBazaar SDK — contract interaction helpers
 * Wraps WalletContext.signAndSend for all on-chain operations
 */

import type { AgentTx } from '@/context/WalletContext';

const REGISTRY   = process.env.NEXT_PUBLIC_REGISTRY_CONTRACT   ?? '';
const ESCROW     = process.env.NEXT_PUBLIC_ESCROW_CONTRACT     ?? '';
const REPUTATION = process.env.NEXT_PUBLIC_REPUTATION_CONTRACT ?? '';

export const contracts = { REGISTRY, ESCROW, REPUTATION };

/**
 * Build a createTask TX to be signed via WalletContext.signAndSend
 */
export function buildCreateTaskTx(opts: {
  taskId:    string;
  serviceId: string;
  provider:  string;
  budgetEGLD: string;     // e.g. '0.001'
}): AgentTx {
  const payload = [
    'createTask',
    Buffer.from(opts.taskId).toString('hex'),
    Buffer.from(opts.serviceId).toString('hex'),
    opts.provider,
    Buffer.from('').toString('hex'), // payload_hash placeholder
  ].join('@');

  return {
    receiver: ESCROW,
    value:    opts.budgetEGLD,
    data:     payload,
    gasLimit: 10_000_000,
  };
}

/**
 * Build a registerService TX
 */
export function buildRegisterServiceTx(opts: {
  serviceId:    string;
  name:         string;
  category:     string;
  endpointUrl:  string;
  pricingModel: string;
  price:        bigint;   // in wei (1 EGLD = 10^18)
  metadataUri:  string;
  stakeEGLD:    string;
}): AgentTx {
  const payload = [
    'registerService',
    Buffer.from(opts.serviceId).toString('hex'),
    Buffer.from(opts.name).toString('hex'),
    Buffer.from(opts.category).toString('hex'),
    Buffer.from(opts.endpointUrl).toString('hex'),
    Buffer.from(opts.pricingModel).toString('hex'),
    opts.price.toString(16).padStart(2, '0'),
    Buffer.from(opts.metadataUri).toString('hex'),
  ].join('@');

  return {
    receiver: REGISTRY,
    value:    opts.stakeEGLD,
    data:     payload,
    gasLimit: 15_000_000,
  };
}

/**
 * Format EGLD from wei string
 */
export function formatEGLD(wei: string, decimals = 4): string {
  try {
    const n = BigInt(wei);
    const egld = Number(n) / 1e18;
    return egld.toFixed(decimals);
  } catch {
    return '0.0000';
  }
}

/**
 * Shorten erd1 address
 */
export function shortAddr(addr: string, chars = 6): string {
  if (!addr) return '';
  return `${addr.slice(0, chars + 4)}...${addr.slice(-4)}`;
}
