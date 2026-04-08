/**
 * AgentBazaar SDK — Register Service on Devnet
 * Example: provider agent registers a data-fetching service.
 */

import {
  Address,
  SmartContract,
  AbiRegistry,
  ResultsParser,
  TransactionWatcher,
  ApiNetworkProvider,
  Account,
  TransactionPayload,
} from "@multiversx/sdk-core";

import { DEVNET, loadDevnetConfig } from "./devnet";

export interface ServiceRegistrationParams {
  serviceId:           string;
  name:                string;
  category:            string;
  endpointUrl:         string;
  pricingModel:        string;    // "per-request" | "per-second" | "per-result"
  pricePerUnit:        bigint;    // in EGLD wei
  maxLatencyMs:        number;
  uptimeGuaranteeBps:  number;    // 9500 = 95%
  ucpCompatible:       boolean;
  mcpCompatible:       boolean;
  metadataHash:        string;    // IPFS CID or Arweave tx ID
  stakeAmount:         bigint;    // must be >= minStake (0.05 EGLD)
}

/**
 * Register a service in the AgentBazaar Registry contract.
 * Returns the transaction hash on success.
 */
export async function registerService(
  params: ServiceRegistrationParams,
  signerAddress: string,
): Promise<string> {
  const config  = loadDevnetConfig();
  const provider = new ApiNetworkProvider(DEVNET.API, { clientName: "agentbazaar-sdk" });

  // Encode arguments as MultiversX smart contract call
  const args = [
    `str:${params.serviceId}`,
    `str:${params.name}`,
    `str:${params.category}`,
    `str:${params.endpointUrl}`,
    `str:${params.pricingModel}`,
    params.pricePerUnit.toString(),
    params.maxLatencyMs.toString(),
    params.uptimeGuaranteeBps.toString(),
    params.ucpCompatible  ? "true" : "false",
    params.mcpCompatible  ? "true" : "false",
    `str:${params.metadataHash}`,
  ];

  const dataField = `registerService@${args.map(encodeArg).join("@")}`;

  const account = await provider.getAccount(Address.fromBech32(signerAddress));
  console.log(`📡 Sending registerService tx to Registry @ ${config.contracts.registry}`);
  console.log(`   Service ID  : ${params.serviceId}`);
  console.log(`   Stake       : ${Number(params.stakeAmount) / 1e18} EGLD`);
  console.log(`   Data field  : ${dataField.substring(0, 80)}...`);

  // NOTE: actual signing requires wallet integration (mxpy or browser wallet)
  // This returns the encoded data field for use with any signer
  return dataField;
}

function encodeArg(arg: string): string {
  if (arg.startsWith("str:")) {
    return Buffer.from(arg.slice(4)).toString("hex");
  }
  if (arg === "true")  return "01";
  if (arg === "false") return "00";
  const n = BigInt(arg);
  const hex = n.toString(16);
  return hex.length % 2 === 0 ? hex : "0" + hex;
}
