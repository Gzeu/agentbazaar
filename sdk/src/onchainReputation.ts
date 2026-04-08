/**
 * onchainReputation.ts
 * Real on-chain Reputation contract client.
 * Submits completion proofs, reads scores, triggers slashing.
 */

import { ChainClient } from "./chainClient";
import { buildSubmitCompletionProofCall, buildSlashProviderCall, buildGetReputationQuery } from "./txBuilder";
import { DevnetConfig, ReputationRecord } from "./types";
import { OnChainSigner } from "./onchainRegistry";

function decodeBase64Number(b64: string): number {
  return parseInt(Buffer.from(b64, "base64").toString("hex"), 16) || 0;
}

export class OnChainReputation {
  private readonly client: ChainClient;
  private readonly config: DevnetConfig;

  constructor(config: DevnetConfig) {
    this.config = config;
    this.client = new ChainClient(config);
  }

  async submitCompletionProof(
    signer: OnChainSigner,
    taskId: string,
    proofHash: string,
    latencyMs: number,
  ): Promise<string> {
    const reputationAddress = this.config.addresses.reputation;
    if (!reputationAddress) throw new Error("Reputation contract address not set");

    const { data, gasLimit } = buildSubmitCompletionProofCall(taskId, proofHash, latencyMs);
    const nonce = await signer.getNonce();
    const signature = await signer.sign(data);

    const { txHash } = await this.client.sendTransaction({
      nonce,
      sender: signer.getAddress(),
      receiver: reputationAddress,
      value: "0",
      data,
      gasLimit,
      chainID: this.config.chainId,
      signature,
    });

    await this.client.awaitTransactionCompletion(txHash);
    return txHash;
  }

  async slashProvider(
    signer: OnChainSigner,
    provider: string,
    taskId: string,
    reason: string,
  ): Promise<string> {
    const reputationAddress = this.config.addresses.reputation;
    if (!reputationAddress) throw new Error("Reputation contract address not set");

    const { data, gasLimit } = buildSlashProviderCall(provider, taskId, reason);
    const nonce = await signer.getNonce();
    const signature = await signer.sign(data);

    const { txHash } = await this.client.sendTransaction({
      nonce,
      sender: signer.getAddress(),
      receiver: reputationAddress,
      value: "0",
      data,
      gasLimit,
      chainID: this.config.chainId,
      signature,
    });

    await this.client.awaitTransactionCompletion(txHash);
    return txHash;
  }

  async getReputation(address: string): Promise<ReputationRecord | null> {
    const reputationAddress = this.config.addresses.reputation;
    if (!reputationAddress) throw new Error("Reputation contract address not set");

    const args = buildGetReputationQuery(address);
    const result = await this.client.queryContract({
      scAddress: reputationAddress,
      funcName: "getReputation",
      args,
    });

    if (result.returnCode !== "ok" || !result.returnData?.length) return null;

    const [scoreB64, completedB64, failedB64, disputedB64, latencyB64] = result.returnData;
    return {
      address,
      score: decodeBase64Number(scoreB64 ?? ""),
      completedTasks: decodeBase64Number(completedB64 ?? ""),
      failedTasks: decodeBase64Number(failedB64 ?? ""),
      disputedTasks: decodeBase64Number(disputedB64 ?? ""),
      medianLatencyMs: decodeBase64Number(latencyB64 ?? ""),
      updatedAt: Date.now(),
    };
  }
}
