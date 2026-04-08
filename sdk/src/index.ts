/**
 * AgentBazaar SDK v0.3.0-devnet — Full On-Chain Integration
 *
 * Layers:
 *  - types          : shared TypeScript interfaces
 *  - chainClient    : low-level MultiversX proxy client
 *  - txBuilder      : SC call data encoder
 *  - onchainRegistry: Registry contract read/write
 *  - onchainEscrow  : Escrow contract read/write
 *  - onchainReputation: Reputation contract read/write
 *  - eventListener  : Real-time SC event polling
 *  - quoteEngine    : Off-chain quote generation
 *  - x402 / acp / ap2: Payment rails & mandate engine
 *  - mcp            : Execution handler
 *  - ucp            : Discovery & filtering
 *  - providerRunner / consumerRunner: Agent runners
 *  - agentBazaar    : Unified facade
 */

export * from "./types";
export * from "./chainClient";
export * from "./txBuilder";
export * from "./onchainRegistry";
export * from "./onchainEscrow";
export * from "./onchainReputation";
export * from "./eventListener";
export * from "./quoteEngine";
export * from "./x402";
export * from "./acp";
export * from "./ap2";
export * from "./reputation";
export * from "./mcp";
export * from "./ucp";
export * from "./providerRunner";
export * from "./consumerRunner";
export * from "./devnet";
export * from "./registerService";
export * from "./discoverServices";
export * from "./createTask";
export { AgentBazaar } from "./agentBazaar";

export const SDK_VERSION = "0.3.0-devnet";
export const SUPPORTED_NETWORK = "devnet";
