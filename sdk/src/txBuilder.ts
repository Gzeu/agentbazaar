/**
 * txBuilder.ts
 * Builds and encodes MultiversX SC call data strings.
 * Each smart contract endpoint is encoded as:
 *   functionName@hex(arg1)@hex(arg2)...
 * Signing is done externally via mxpy or a signer integration;
 * this module only produces the data field and gas estimates.
 */

function toHex(value: string | bigint | number): string {
  if (typeof value === "bigint" || typeof value === "number") {
    const hex = BigInt(value).toString(16);
    return hex.length % 2 === 0 ? hex : "0" + hex;
  }
  // UTF-8 string → hex
  return Buffer.from(value, "utf8").toString("hex");
}

function addressToHex(bech32Address: string): string {
  // For devnet integration, pass address as UTF-8 hex;
  // in production replace with proper bech32 decode.
  return Buffer.from(bech32Address, "utf8").toString("hex");
}

export interface RegistryCallData {
  data: string;
  gasLimit: number;
}

// --- Registry contract calls ---

export function buildRegisterServiceCall(
  serviceId: string,
  name: string,
  category: string,
  endpointUrl: string,
  pricingModel: string,
  price: bigint,
  metadataUri: string,
  gasLimit = 80_000_000,
): RegistryCallData {
  const data = [
    "registerService",
    toHex(serviceId),
    toHex(name),
    toHex(category),
    toHex(endpointUrl),
    toHex(pricingModel),
    toHex(price),
    toHex(metadataUri),
  ].join("@");
  return { data, gasLimit };
}

export function buildUpdateServiceCall(
  serviceId: string,
  price: bigint,
  active: boolean,
  gasLimit = 50_000_000,
): RegistryCallData {
  const data = [
    "updateService",
    toHex(serviceId),
    toHex(price),
    toHex(active ? 1 : 0),
  ].join("@");
  return { data, gasLimit };
}

export function buildDeregisterServiceCall(
  serviceId: string,
  gasLimit = 40_000_000,
): RegistryCallData {
  const data = ["deregisterService", toHex(serviceId)].join("@");
  return { data, gasLimit };
}

// --- Escrow contract calls ---

export function buildCreateTaskCall(
  taskId: string,
  serviceId: string,
  provider: string,
  payloadHash: string,
  gasLimit = 100_000_000,
): RegistryCallData {
  const data = [
    "createTask",
    toHex(taskId),
    toHex(serviceId),
    addressToHex(provider),
    toHex(payloadHash),
  ].join("@");
  return { data, gasLimit };
}

export function buildReleaseEscrowCall(
  taskId: string,
  proofHash: string,
  gasLimit = 60_000_000,
): RegistryCallData {
  const data = ["releaseEscrow", toHex(taskId), toHex(proofHash)].join("@");
  return { data, gasLimit };
}

export function buildRefundTaskCall(
  taskId: string,
  gasLimit = 40_000_000,
): RegistryCallData {
  const data = ["refundTask", toHex(taskId)].join("@");
  return { data, gasLimit };
}

export function buildOpenDisputeCall(
  taskId: string,
  reason: string,
  gasLimit = 60_000_000,
): RegistryCallData {
  const data = ["openDispute", toHex(taskId), toHex(reason)].join("@");
  return { data, gasLimit };
}

// --- Reputation contract calls ---

export function buildSubmitCompletionProofCall(
  taskId: string,
  proofHash: string,
  latencyMs: number,
  gasLimit = 50_000_000,
): RegistryCallData {
  const data = [
    "submitCompletionProof",
    toHex(taskId),
    toHex(proofHash),
    toHex(latencyMs),
  ].join("@");
  return { data, gasLimit };
}

export function buildSlashProviderCall(
  provider: string,
  taskId: string,
  reason: string,
  gasLimit = 60_000_000,
): RegistryCallData {
  const data = [
    "slashProvider",
    addressToHex(provider),
    toHex(taskId),
    toHex(reason),
  ].join("@");
  return { data, gasLimit };
}

// --- Query helpers ---

export function buildGetServiceQuery(serviceId: string): string[] {
  return [toHex(serviceId)];
}

export function buildGetReputationQuery(address: string): string[] {
  return [addressToHex(address)];
}

export function buildGetTaskQuery(taskId: string): string[] {
  return [toHex(taskId)];
}
