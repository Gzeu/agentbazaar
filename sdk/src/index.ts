/**
 * AgentBazaar SDK — Main Exports
 * Provider agents: registerService
 * Consumer agents: discoverServices, getService, createTask
 * Devnet utils: loadDevnetConfig, validateDeployedAddresses, explorerAddress
 */

export * from "./devnet";
export * from "./registerService";
export * from "./discoverServices";
export * from "./createTask";

export const SDK_VERSION = "0.1.0-devnet";
export const SUPPORTED_NETWORK = "devnet";
