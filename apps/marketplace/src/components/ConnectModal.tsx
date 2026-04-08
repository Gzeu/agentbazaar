"use client";
import { useCallback } from "react";
import { WALLETCONNECT_V2_PROJECT_ID, MVX_ENVIRONMENT } from "@/lib/mvx/config";

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

  const loginWithXPortal = useCallback(async () => {
    if (!WALLETCONNECT_V2_PROJECT_ID) {
      alert(
        "WalletConnect Project ID not configured.\nSet NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in .env.local"
      );
      return;
    }
    try {
      const { WalletConnectV2Provider } = await import(
        "@multiversx/sdk-wallet-connect-provider"
      );
      const provider = new WalletConnectV2Provider(
        {
          onClientLogin: () => {
            console.log("[ConnectModal] xPortal login OK");
            onClose();
          },
          onClientLogout: () => console.log("[ConnectModal] xPortal logout"),
          onClientEvent: (event) => console.log("[ConnectModal] event:", event),
        },
        MVX_ENVIRONMENT === "mainnet" ? "1" : "D",
        WALLETCONNECT_V2_PROJECT_ID,
        [{ topic: "relay", value: "wss://relay.walletconnect.com" }]
      );
      const wcUri = await provider.connect();
      if (wcUri) {
        // In production: show QR code with wcUri
        console.log("[ConnectModal] WC URI:", wcUri);
        const encoded = encodeURIComponent(wcUri);
        window.open(
          `https://maiar.page.link/?apn=com.elrond.maiar&link=https://xportal.com/wc?uri=${encoded}`,
          "_blank"
        );
      }
    } catch (e) {
      console.error("[ConnectModal] xPortal login failed:", e);
    }
  }, [onClose]);

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
          {/* xPortal */}
          <button
            onClick={loginWithXPortal}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors hover:border-[var(--color-primary)] text-left"
            style={{
              background: "var(--color-surface-2)",
              borderColor: "var(--color-border)",
            }}
          >
            <span className="text-2xl">📱</span>
            <div>
              <div
                className="text-sm font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                xPortal App
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                Scan QR with xPortal mobile · WalletConnect v2
              </div>
            </div>
          </button>

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
