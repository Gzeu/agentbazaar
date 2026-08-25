"use client";
import { useCallback } from "react";
import { MVX_ENVIRONMENT } from "@/lib/mvx/config";

interface ConnectModalProps {
  onClose: () => void;
}

export function ConnectModal({ onClose }: ConnectModalProps) {
  const loginWithExtension = useCallback(async () => {
    try {
      const { ExtensionProvider } = await import(
        "@multiversx/sdk-extension-provider"
      );
      const provider = ExtensionProvider.getInstance();
      await provider.init();
      const address = await provider.login();
      console.log("[ConnectModal] Extension login:", address);
      onClose();
    } catch (e) {
      console.error("[ConnectModal] Extension login failed:", e);
    }
  }, [onClose]);

  const loginWithWebWallet = useCallback(() => {
    const env = MVX_ENVIRONMENT;
    const callbackUrl = encodeURIComponent(window.location.href);
    const baseUrl =
      env === "mainnet"
        ? "https://wallet.multiversx.com"
        : `https://${env}-wallet.multiversx.com`;
    window.location.href = `${baseUrl}/hook/login?callbackUrl=${callbackUrl}`;
  }, []);


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-sm space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold" style={{ color: "var(--color-text)" }}>
            Connect Wallet
          </h2>
          <button onClick={onClose} style={{ color: "var(--color-text-muted)" }}>
            ✕

          {/* Dev quick-login (non-mainnet only) */}
          {MVX_ENVIRONMENT !== "mainnet" && (
            <button
              onClick={() => {
                const devAddr = "erd1qyu5wthldzx5cpf7ly8wx5cpf7ly8wx5cpf7ly8wx5cpf7ly8wx5cpf7ly8wx5c";
                window.localStorage.setItem("ab:devAddress", devAddr);
                window.dispatchEvent(new Event("dev-address"));
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors hover:border-[var(--color-primary)] text-left"
              style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)" }}
            >
              <span className="text-2xl">⚡</span>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Quick dev login</div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Simulate connect on {MVX_ENVIRONMENT} (no wallet needed)</div>
              </div>
            </button>
          )}
          </button>
        </div>

        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Choose how you want to connect to AgentBazaar on MultiversX{" "}
          <span
            className="font-semibold"
            style={{ color: "var(--color-primary)" }}
          >
            {MVX_ENVIRONMENT}
          </span>
          .
        </p>

        {/* Options */}
        <div className="space-y-3">
          {/* Browser Extension */}
          <button
            onClick={loginWithExtension}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors hover:border-[var(--color-primary)] text-left"
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

          {/* Web Wallet */}
          <button
            onClick={loginWithWebWallet}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors hover:border-[var(--color-primary)] text-left"
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
        </div>

        <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
          Non-custodial · No private keys stored
        </p>
      </div>
    </div>
  );
}
