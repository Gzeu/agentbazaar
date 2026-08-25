"use client";
import { useState, useCallback } from "react";
import { useWallet } from "@/context/WalletContext";
import { MVX_ENVIRONMENT } from "@/lib/mvx/config";

interface ConnectModalProps {
  onClose: () => void;
}

export function ConnectModal({ onClose }: ConnectModalProps) {
  const { signer, setAddress: setWalletAddress } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loginWithExtension = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const addr = await signer.connectExtension();
      setWalletAddress(String(addr));
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [signer, setWalletAddress, onClose]);

  const loginWithWebWallet = useCallback(() => {
    setError(null);
    try {
      void signer.connectWebWallet(window.location.href);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [signer]);

  const loginWithDev = useCallback(() => {
    const devAddr =
      "erd1qyu5wthldzx5cpf7ly8wx5cpf7ly8wx5cpf7ly8wx5cpf7ly8wx5cpf7ly8wx5c";
    window.localStorage.setItem("ab:devAddress", devAddr);
    window.dispatchEvent(new Event("dev-address"));
    onClose();
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-4 p-6 rounded-2xl"
        style={{ background: "var(--color-surface-1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-xl font-bold mb-2"
          style={{ color: "var(--color-text)" }}
        >
          Connect Wallet
        </h2>
        <p
          className="text-sm mb-6"
          style={{ color: "var(--color-text-muted)" }}
        >
          Choose how you want to sign messages on{" "}
          <span
            className="font-semibold"
            style={{ color: "var(--color-primary)" }}
          >
            {MVX_ENVIRONMENT}
          </span>
          .
        </p>

        {error && (
          <div
            className="mb-4 p-3 rounded-lg text-sm"
            style={{
              background: "var(--color-danger-bg, #fee)",
              color: "var(--color-danger, #c00)",
            }}
          >
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={loginWithExtension}
            disabled={busy}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors hover:border-[var(--color-primary)] text-left disabled:opacity-50"
            style={{
              background: "var(--color-surface-2)",
              borderColor: "var(--color-border)",
            }}
          >
            <span className="text-2xl">🧩</span>
            <div>
              <div
                className="text-sm font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                MultiversX DeFi Wallet
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                Browser extension
              </div>
            </div>
          </button>

          <button
            onClick={loginWithWebWallet}
            disabled={busy}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors hover:border-[var(--color-primary)] text-left disabled:opacity-50"
            style={{
              background: "var(--color-surface-2)",
              borderColor: "var(--color-border)",
            }}
          >
            <span className="text-2xl">🌐</span>
            <div>
              <div
                className="text-sm font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                Web Wallet
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {MVX_ENVIRONMENT}-wallet.multiversx.com
              </div>
            </div>
          </button>

          {MVX_ENVIRONMENT !== "mainnet" && (
            <button
              onClick={loginWithDev}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors hover:border-[var(--color-primary)] text-left"
              style={{
                background: "var(--color-surface-2)",
                borderColor: "var(--color-border)",
              }}
            >
              <span className="text-2xl">⚡</span>
              <div>
                <div
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text)" }}
                >
                  Quick dev login
                </div>
                <div
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Simulate connect on {MVX_ENVIRONMENT} (no wallet needed)
                </div>
              </div>
            </button>
          )}
        </div>

        <p
          className="text-xs text-center mt-6"
          style={{ color: "var(--color-text-muted)" }}
        >
          Non-custodial · No private keys stored
        </p>
      </div>
    </div>
  );
}
