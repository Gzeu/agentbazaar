/**
 * AgentBazaar SDK — Devnet Configuration & Client Bootstrap
 * Connects SDK to deployed devnet contracts.
 */

import fs from "fs";
import path from "path";

export interface DevnetConfig {
  network: string;
  chainID: string;
  proxy: string;
  explorer: string;
  api: string;
  gasPrice: number;
  gasLimit: {
    registry: number;
    escrow: number;
    reputation: number;
  };
  contracts: {
    registry: string;
    escrow: string;
    reputation: string;
  };
  minStakeEgld: string;
  marketplaceFeeBps: number;
  disputeWindowSeconds: number;
  taskTimeoutSeconds: number;
}

/** Load devnet config from multiversx.json */
export function loadDevnetConfig(configPath?: string): DevnetConfig {
  const p = configPath ?? path.resolve(__dirname, "../../devnet/multiversx.json");
  const raw = fs.readFileSync(p, "utf-8");
  return JSON.parse(raw) as DevnetConfig;
}

/** Validate all 3 contract addresses are set */
export function validateDeployedAddresses(config: DevnetConfig): void {
  const { registry, escrow, reputation } = config.contracts;
  if (!registry)   throw new Error("❌ Registry contract address not set in devnet/multiversx.json");
  if (!escrow)     throw new Error("❌ Escrow contract address not set in devnet/multiversx.json");
  if (!reputation) throw new Error("❌ Reputation contract address not set in devnet/multiversx.json");
  console.log("✅ All contract addresses validated:");
  console.log(`   Registry   : ${registry}`);
  console.log(`   Escrow     : ${escrow}`);
  console.log(`   Reputation : ${reputation}`);
}

/** Devnet constants */
export const DEVNET = {
  PROXY:    "https://devnet-gateway.multiversx.com",
  CHAIN_ID: "D",
  API:      "https://devnet-api.multiversx.com",
  EXPLORER: "https://devnet-explorer.multiversx.com",
  FAUCET:   "https://devnet-wallet.multiversx.com/faucet",
} as const;

/** Build explorer URL for address */
export function explorerAddress(address: string): string {
  return `${DEVNET.EXPLORER}/accounts/${address}`;
}

/** Build explorer URL for tx hash */
export function explorerTx(txHash: string): string {
  return `${DEVNET.EXPLORER}/transactions/${txHash}`;
}
