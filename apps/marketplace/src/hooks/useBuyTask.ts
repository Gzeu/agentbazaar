"use client";
import { useState, useCallback } from "react";
import { useWallet } from "@/context/WalletContext";
import { MVX_ENVIRONMENT, CONTRACT_ADDRESSES } from "@/lib/mvx/config";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export type BuyTaskStep =
  | "idle"
  | "building"
  | "signing"
  | "broadcasting"
  | "confirming"
  | "done"
  | "error";

export interface BuyTaskResult {
  txHash: string;
  taskId: string;
}

export function useBuyTask() {
  const { address, connected } = useWallet();
  const [step, setStep]     = useState<BuyTaskStep>("idle");
  const [error, setError]   = useState<string | null>(null);
  const [result, setResult] = useState<BuyTaskResult | null>(null);

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setResult(null);
  }, []);

  const buyTask = useCallback(
    async (params: {
      serviceId: string;
      providerAddress: string;
      priceRaw: number;  // EGLD
      payload: Record<string, unknown>;
    }) => {
      if (!connected || !address) {
        setError("Wallet not connected");
        return;
      }

      setStep("building");
      setError(null);

      try {
        const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const payloadHash = await sha256(JSON.stringify(params.payload));
        const amountWei   = BigInt(Math.round(params.priceRaw * 1e18)).toString();

        // ── 1. Register task in backend ───────────────────────────────────
        setStep("building");
        let escrowTxHash: string | undefined;

        // ── 2. Build on-chain createTask TX ──────────────────────────────
        if (CONTRACT_ADDRESSES.escrow) {
          setStep("signing");
          try {
            const { Transaction, Address, TransactionPayload } = await import("@multiversx/sdk-core");
            const networkConfig = await getNetworkConfig();

            // Build data field: createTask@taskId@serviceId@providerAddr
            const fnData = [
              "createTask",
              Buffer.from(taskId).toString("hex"),
              Buffer.from(params.serviceId).toString("hex"),
              new Address(params.providerAddress).toHex(),
              payloadHash,
            ].join("@");

            const tx = new Transaction({
              nonce: networkConfig.nonce,
              sender: new Address(address),
              receiver: new Address(CONTRACT_ADDRESSES.escrow),
              value: BigInt(amountWei),
              gasLimit: BigInt(10_000_000),
              data: Buffer.from(fnData),
              chainID: MVX_ENVIRONMENT === "mainnet" ? "1" : "D",
            });

            // Sign via sdk-dapp signTransactions
            setStep("signing");
            const { signTransactions } = await import(
              "@multiversx/sdk-dapp/out/hooks/transactions/useSignTransactions"
            );

            const signedTx = await new Promise<typeof tx>((resolve, reject) => {
              // Simplified: in real app use useSendTransactions hook from sdk-dapp
              // For now we just proceed to backend registration
              resolve(tx);
            });

            setStep("broadcasting");
            // broadcast
            const { ApiNetworkProvider } = await import("@multiversx/sdk-network-providers");
            const provider = new ApiNetworkProvider(
              MVX_ENVIRONMENT === "mainnet"
                ? "https://api.multiversx.com"
                : `https://${MVX_ENVIRONMENT}-api.multiversx.com`
            );
            escrowTxHash = await provider.sendTransaction(signedTx as never);
          } catch (txErr) {
            console.warn("[useBuyTask] on-chain TX failed, proceeding off-chain:", txErr);
          }
        }

        // ── 3. Register in backend ────────────────────────────────────────
        setStep("confirming");
        const backendRes = await fetch(`${BACKEND_URL}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceId:       params.serviceId,
            consumerId:      address,
            providerAddress: params.providerAddress,
            payload:         params.payload,
            maxBudget:       amountWei,
            escrowTxHash,
          }),
        });

        if (!backendRes.ok) {
          const err = await backendRes.json().catch(() => ({}));
          throw new Error((err as { message?: string }).message ?? "Backend task creation failed");
        }

        const task = await backendRes.json() as { id: string };

        setResult({ txHash: escrowTxHash ?? "off-chain", taskId: task.id });
        setStep("done");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setStep("error");
      }
    },
    [address, connected]
  );

  return { buyTask, step, error, result, reset };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getNetworkConfig(): Promise<{ nonce: number }> {
  try {
    const { getStore } = await import("@multiversx/sdk-dapp/out/reduxStore/store");
    const store = getStore();
    const state = store?.getState();
    const nonce = state?.account?.account?.nonce ?? 0;
    return { nonce };
  } catch {
    return { nonce: 0 };
  }
}
