/**
 * onchainRegistry.ts
 * Real on-chain Registry contract client.
 * Reads & writes service listings directly from/to the MultiversX devnet.
 */

import { ChainClient } from "./chainClient";
import { buildRegisterServiceCall, buildUpdateServiceCall, buildDeregisterServiceCall, buildGetServiceQuery } from "./txBuilder";
import { DevnetConfig, ServiceDescriptor } from "./types";

export interface RegisterServiceOnChainInput {
  signer: OnChainSigner;
  service: ServiceDescriptor & { serviceId: string };
  stakeEgld?: string;
}

export interface UpdateServiceOnChainInput {
  signer: OnChainSigner;
  serviceId: string;
  price: bigint;
  active: boolean;
}

/**
 * OnChainSigner — implement this interface with mxpy wallet or any
 * MultiversX signing library (e.g. @multiversx/sdk-core UserSigner).
 */
export interface OnChainSigner {
  getAddress(): string;
  getNonce(): Promise<number>;
  sign(dataToSign: string): Promise<string>;
}

function decodeBase64Utf8(b64: string): string {
  return Buffer.from(b64, "base64").toString("utf8");
}

export class OnChainRegistry {
  private readonly client: ChainClient;
  private readonly config: DevnetConfig;

  constructor(config: DevnetConfig) {
    this.config = config;
    this.client = new ChainClient(config);
  }

  async registerService(input: RegisterServiceOnChainInput): Promise<string> {
    const registryAddress = this.config.addresses.registry;
    if (!registryAddress) throw new Error("Registry contract address not set in devnet config");

    const { service, signer } = input;
    const { data, gasLimit } = buildRegisterServiceCall(
      service.serviceId,
      service.name,
      service.category,
      service.endpoint,
      service.pricingModel,
      BigInt(service.price ?? "0"),
      service.metadataUri ?? "",
    );

    const nonce = await signer.getNonce();
    const signature = await signer.sign(data);

    const { txHash } = await this.client.sendTransaction({
      nonce,
      sender: signer.getAddress(),
      receiver: registryAddress,
      value: input.stakeEgld ?? "0",
      data,
      gasLimit,
      chainID: this.config.chainId,
      signature,
    });

    await this.client.awaitTransactionCompletion(txHash);
    return txHash;
  }

  async updateService(input: UpdateServiceOnChainInput): Promise<string> {
    const registryAddress = this.config.addresses.registry;
    if (!registryAddress) throw new Error("Registry contract address not set");

    const { data, gasLimit } = buildUpdateServiceCall(
      input.serviceId,
      input.price,
      input.active,
    );

    const nonce = await input.signer.getNonce();
    const signature = await input.signer.sign(data);

    const { txHash } = await this.client.sendTransaction({
      nonce,
      sender: input.signer.getAddress(),
      receiver: registryAddress,
      value: "0",
      data,
      gasLimit,
      chainID: this.config.chainId,
      signature,
    });

    await this.client.awaitTransactionCompletion(txHash);
    return txHash;
  }

  async deregisterService(signer: OnChainSigner, serviceId: string): Promise<string> {
    const registryAddress = this.config.addresses.registry;
    if (!registryAddress) throw new Error("Registry contract address not set");

    const { data, gasLimit } = buildDeregisterServiceCall(serviceId);
    const nonce = await signer.getNonce();
    const signature = await signer.sign(data);

    const { txHash } = await this.client.sendTransaction({
      nonce,
      sender: signer.getAddress(),
      receiver: registryAddress,
      value: "0",
      data,
      gasLimit,
      chainID: this.config.chainId,
      signature,
    });

    await this.client.awaitTransactionCompletion(txHash);
    return txHash;
  }

  async getServiceOnChain(serviceId: string): Promise<Partial<ServiceDescriptor> | null> {
    const registryAddress = this.config.addresses.registry;
    if (!registryAddress) throw new Error("Registry contract address not set");

    const args = buildGetServiceQuery(serviceId);
    const result = await this.client.queryContract({
      scAddress: registryAddress,
      funcName: "getService",
      args,
    });

    if (result.returnCode !== "ok" || !result.returnData?.length) return null;

    const [nameB64, categoryB64, endpointB64, pricingB64, priceB64] = result.returnData;
    return {
      serviceId,
      name: decodeBase64Utf8(nameB64 ?? ""),
      category: decodeBase64Utf8(categoryB64 ?? ""),
      endpoint: decodeBase64Utf8(endpointB64 ?? ""),
      pricingModel: decodeBase64Utf8(pricingB64 ?? "") as ServiceDescriptor["pricingModel"],
      price: decodeBase64Utf8(priceB64 ?? ""),
    };
  }

  get chainClient(): ChainClient {
    return this.client;
  }
}
