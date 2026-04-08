/**
 * chainClient.ts
 * Low-level MultiversX devnet client.
 * Wraps proxy REST calls: getAccount, sendTransaction, queryContract, getTransactionStatus.
 */

import { DevnetConfig } from "./types";

export interface AccountOnChain {
  address: string;
  balance: string;
  nonce: number;
}

export interface SendTxInput {
  nonce: number;
  sender: string;
  receiver: string;
  value: string;
  data: string;
  gasLimit: number;
  chainID: string;
  version?: number;
  signature: string;
}

export interface SendTxResult {
  txHash: string;
  status?: string;
}

export interface QueryInput {
  scAddress: string;
  funcName: string;
  caller?: string;
  args?: string[];
}

export interface QueryResult {
  returnCode: string;
  returnData: string[];
  returnMessage?: string;
}

export interface TxStatus {
  hash: string;
  status: string;
  smartContractResults?: Array<{
    hash: string;
    nonce: number;
    value: number;
    receiver: string;
    sender: string;
    data: string;
    returnMessage?: string;
  }>;
}

export class ChainClient {
  private readonly proxy: string;
  private readonly chainID: string;

  constructor(config: DevnetConfig) {
    this.proxy = config.proxy;
    this.chainID = config.chainId;
  }

  async getAccount(address: string): Promise<AccountOnChain> {
    const res = await fetch(`${this.proxy}/address/${address}`);
    if (!res.ok) throw new Error(`getAccount failed: ${res.status}`);
    const json = await res.json() as { data: { account: AccountOnChain } };
    return json.data.account;
  }

  async getNetworkConfig(): Promise<Record<string, unknown>> {
    const res = await fetch(`${this.proxy}/network/config`);
    if (!res.ok) throw new Error(`getNetworkConfig failed: ${res.status}`);
    const json = await res.json() as { data: { config: Record<string, unknown> } };
    return json.data.config;
  }

  async sendTransaction(tx: SendTxInput): Promise<SendTxResult> {
    const payload = {
      nonce: tx.nonce,
      sender: tx.sender,
      receiver: tx.receiver,
      value: tx.value,
      data: Buffer.from(tx.data).toString("base64"),
      gasLimit: tx.gasLimit,
      chainID: this.chainID,
      version: tx.version ?? 1,
      signature: tx.signature,
    };

    const res = await fetch(`${this.proxy}/transaction/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json() as { data?: { txHash: string }; error?: string };
    if (!res.ok || !json.data?.txHash) {
      throw new Error(`sendTransaction failed: ${json.error ?? res.status}`);
    }

    return { txHash: json.data.txHash };
  }

  async queryContract(input: QueryInput): Promise<QueryResult> {
    const payload = {
      scAddress: input.scAddress,
      funcName: input.funcName,
      caller: input.caller ?? input.scAddress,
      args: input.args ?? [],
    };

    const res = await fetch(`${this.proxy}/vm-values/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json() as {
      data?: { data: { returnCode: string; returnData: string[]; returnMessage?: string } };
      error?: string;
    };

    if (!res.ok || !json.data) {
      throw new Error(`queryContract failed: ${json.error ?? res.status}`);
    }

    return json.data.data;
  }

  async getTransactionStatus(txHash: string): Promise<TxStatus> {
    const res = await fetch(`${this.proxy}/transaction/${txHash}?withResults=true`);
    if (!res.ok) throw new Error(`getTransactionStatus failed: ${res.status}`);
    const json = await res.json() as { data: { transaction: TxStatus } };
    return json.data.transaction;
  }

  async awaitTransactionCompletion(
    txHash: string,
    pollMs = 400,
    timeoutMs = 15000,
  ): Promise<TxStatus> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const status = await this.getTransactionStatus(txHash);
      if (["success", "fail", "invalid"].includes(status.status)) return status;
      await new Promise((r) => setTimeout(r, pollMs));
    }
    throw new Error(`Transaction ${txHash} did not finalize within ${timeoutMs}ms`);
  }

  explorerTxUrl(txHash: string, explorerBase: string): string {
    return `${explorerBase}/transactions/${txHash}`;
  }
}
