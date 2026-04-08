/**
 * onchainEscrow.ts
 * Real on-chain Escrow contract client.
 * Locks EGLD/ESDT for tasks, releases on proof, refunds on timeout, opens disputes.
 */

import { ChainClient } from "./chainClient";
import { buildCreateTaskCall, buildReleaseEscrowCall, buildRefundTaskCall, buildOpenDisputeCall, buildGetTaskQuery } from "./txBuilder";
import { DevnetConfig } from "./types";
import { OnChainSigner } from "./onchainRegistry";
import crypto from "crypto";

export interface CreateTaskOnChainInput {
  signer: OnChainSigner;
  taskId?: string;
  serviceId: string;
  provider: string;
  input: unknown;
  amountEgld: string;
}

export interface TaskOnChain {
  taskId: string;
  serviceId: string;
  buyer: string;
  provider: string;
  amount: string;
  status: string;
  payloadHash: string;
  proofHash?: string;
  createdAt?: number;
}

function decodeBase64Utf8(b64: string): string {
  return Buffer.from(b64, "base64").toString("utf8");
}

export class OnChainEscrow {
  private readonly client: ChainClient;
  private readonly config: DevnetConfig;

  constructor(config: DevnetConfig) {
    this.config = config;
    this.client = new ChainClient(config);
  }

  async createTask(input: CreateTaskOnChainInput): Promise<{ txHash: string; taskId: string }> {
    const escrowAddress = this.config.addresses.escrow;
    if (!escrowAddress) throw new Error("Escrow contract address not set in devnet config");

    const taskId =
      input.taskId ??
      crypto
        .createHash("sha256")
        .update(`${input.signer.getAddress()}:${input.serviceId}:${Date.now()}`)
        .digest("hex");

    const payloadHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(input.input))
      .digest("hex");

    const { data, gasLimit } = buildCreateTaskCall(
      taskId,
      input.serviceId,
      input.provider,
      payloadHash,
    );

    const nonce = await input.signer.getNonce();
    const signature = await input.signer.sign(data);

    const { txHash } = await this.client.sendTransaction({
      nonce,
      sender: input.signer.getAddress(),
      receiver: escrowAddress,
      value: input.amountEgld,
      data,
      gasLimit,
      chainID: this.config.chainId,
      signature,
    });

    await this.client.awaitTransactionCompletion(txHash);
    return { txHash, taskId };
  }

  async releaseEscrow(
    signer: OnChainSigner,
    taskId: string,
    proofHash: string,
  ): Promise<string> {
    const escrowAddress = this.config.addresses.escrow;
    if (!escrowAddress) throw new Error("Escrow contract address not set");

    const { data, gasLimit } = buildReleaseEscrowCall(taskId, proofHash);
    const nonce = await signer.getNonce();
    const signature = await signer.sign(data);

    const { txHash } = await this.client.sendTransaction({
      nonce,
      sender: signer.getAddress(),
      receiver: escrowAddress,
      value: "0",
      data,
      gasLimit,
      chainID: this.config.chainId,
      signature,
    });

    await this.client.awaitTransactionCompletion(txHash);
    return txHash;
  }

  async refundTask(signer: OnChainSigner, taskId: string): Promise<string> {
    const escrowAddress = this.config.addresses.escrow;
    if (!escrowAddress) throw new Error("Escrow contract address not set");

    const { data, gasLimit } = buildRefundTaskCall(taskId);
    const nonce = await signer.getNonce();
    const signature = await signer.sign(data);

    const { txHash } = await this.client.sendTransaction({
      nonce,
      sender: signer.getAddress(),
      receiver: escrowAddress,
      value: "0",
      data,
      gasLimit,
      chainID: this.config.chainId,
      signature,
    });

    await this.client.awaitTransactionCompletion(txHash);
    return txHash;
  }

  async openDispute(
    signer: OnChainSigner,
    taskId: string,
    reason: string,
  ): Promise<string> {
    const escrowAddress = this.config.addresses.escrow;
    if (!escrowAddress) throw new Error("Escrow contract address not set");

    const { data, gasLimit } = buildOpenDisputeCall(taskId, reason);
    const nonce = await signer.getNonce();
    const signature = await signer.sign(data);

    const { txHash } = await this.client.sendTransaction({
      nonce,
      sender: signer.getAddress(),
      receiver: escrowAddress,
      value: "0",
      data,
      gasLimit,
      chainID: this.config.chainId,
      signature,
    });

    await this.client.awaitTransactionCompletion(txHash);
    return txHash;
  }

  async getTask(taskId: string): Promise<TaskOnChain | null> {
    const escrowAddress = this.config.addresses.escrow;
    if (!escrowAddress) throw new Error("Escrow contract address not set");

    const args = buildGetTaskQuery(taskId);
    const result = await this.client.queryContract({
      scAddress: escrowAddress,
      funcName: "getTask",
      args,
    });

    if (result.returnCode !== "ok" || !result.returnData?.length) return null;

    const [buyerB64, providerB64, amountB64, statusB64, payloadHashB64] = result.returnData;
    return {
      taskId,
      serviceId: "",
      buyer: decodeBase64Utf8(buyerB64 ?? ""),
      provider: decodeBase64Utf8(providerB64 ?? ""),
      amount: decodeBase64Utf8(amountB64 ?? ""),
      status: decodeBase64Utf8(statusB64 ?? ""),
      payloadHash: decodeBase64Utf8(payloadHashB64 ?? ""),
    };
  }
}
