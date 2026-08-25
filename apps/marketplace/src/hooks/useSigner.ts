"use client";

/**
 * useSigner — minimal signer hook for MultiversX on testnet.
 *
 * Supports two providers (no WalletConnect):
 *  - ExtensionProvider (DeFi Wallet browser extension)
 *  - WalletProvider (Web Wallet redirect)
 *
 * Uses the official MultiversX SDKs directly — no sdk-dapp deep imports.
 */

import { useCallback, useEffect, useState } from "react";
import { SignableMessage, Transaction } from "@multiversx/sdk-core";
import { ExtensionProvider } from "@multiversx/sdk-extension-provider";
import { WalletProvider } from "@multiversx/sdk-web-wallet-provider";
import { MVX_ENVIRONMENT } from "@/lib/mvx/config";

export type ProviderType = "extension" | "web-wallet";

const PROVIDER_KEY = "ab:providerType";

function getWebWalletUrl(env: string): string {
  if (env === "mainnet") return "https://wallet.multiversx.com";
  return `https://${env}-wallet.multiversx.com`;
}

function currentProviderType(): ProviderType | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PROVIDER_KEY);
  return raw === "extension" || raw === "web-wallet" ? raw : null;
}

export function useSigner() {
  const [providerType, setProviderType] = useState<ProviderType | null>(
    currentProviderType,
  );
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSignature, setLastSignature] = useState<string | null>(null);

  // Rehydrate extension state
  useEffect(() => {
    if (providerType !== "extension") return;
    (async () => {
      try {
        const provider = ExtensionProvider.getInstance();
        await provider.init();
        const connected = await provider.isConnected();
        if (connected) {
          const addr = await provider.getAddress();
          setAddress(addr);
          setIsConnected(true);
        }
      } catch {
        // extension not installed / not initialised
      }
    })();
  }, [providerType]);

  // Pick up Web Wallet signature on redirect back
  useEffect(() => {
    if (typeof window === "undefined") return;
    const wp = new WalletProvider(getWebWalletUrl(MVX_ENVIRONMENT));
    const sig = wp.getMessageSignatureFromWalletUrl();
    if (sig) {
      setLastSignature(sig);
      setIsConnected(true);
      // Clean the URL (avoid reprocessing on refresh)
      const clean = window.location.pathname;
      window.history.replaceState({}, "", clean);
    }
  }, []);

  const connectExtension = useCallback(async () => {
    setError(null);
    try {
      const provider = ExtensionProvider.getInstance();
      await provider.init();
      const addr = await provider.login();
      window.localStorage.setItem(PROVIDER_KEY, "extension");
      setProviderType("extension");
      setAddress(addr);
      setIsConnected(true);
      return addr;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    }
  }, []);

  const connectWebWallet = useCallback((callbackUrl?: string) => {
    const wp = new WalletProvider(getWebWalletUrl(MVX_ENVIRONMENT));
    window.localStorage.setItem(PROVIDER_KEY, "web-wallet");
    setProviderType("web-wallet");
    return wp.login({
      callbackUrl: callbackUrl ?? (typeof window !== "undefined" ? window.location.href : "/"),
    });
  }, []);

  const disconnect = useCallback(async () => {
    if (providerType === "extension") {
      try { await ExtensionProvider.getInstance().logout(); } catch { /* */ }
    }
    window.localStorage.removeItem(PROVIDER_KEY);
    setProviderType(null);
    setIsConnected(false);
    setAddress(null);
    setLastSignature(null);
  }, [providerType]);

  const signMessage = useCallback(async (message: string): Promise<SignableMessage> => {
    if (!providerType) throw new Error("No wallet provider selected");
    const signable = new SignableMessage({ message: Buffer.from(message) });
    if (providerType === "extension") {
      const provider = ExtensionProvider.getInstance();
      if (!(await provider.isConnected())) throw new Error("Extension not connected");
      return provider.signMessage(signable);
    }
    const wp = new WalletProvider(getWebWalletUrl(MVX_ENVIRONMENT));
    const callbackUrl = (typeof window !== "undefined" ? window.location.href : "/");
    await wp.signMessage(signable, { callbackUrl });
    throw new Error("Web Wallet redirects; signature read on callback via lastSignature.");
  }, [providerType]);

  const signTransaction = useCallback(async (transaction: Transaction): Promise<Transaction> => {
    if (!providerType) throw new Error("No wallet provider selected");
    if (providerType === "extension") {
      const provider = ExtensionProvider.getInstance();
      if (!(await provider.isConnected())) throw new Error("Extension not connected");
      return provider.signTransaction(transaction);
    }
    const wp = new WalletProvider(getWebWalletUrl(MVX_ENVIRONMENT));
    const callbackUrl = (typeof window !== "undefined" ? window.location.href : "/");
    await wp.signTransactions([transaction], { callbackUrl });
    throw new Error("Web Wallet sign-transaction redirects; signed tx is on the callback URL.");
  }, [providerType]);

  return {
    providerType, address, isConnected, error, lastSignature,
    connectExtension, connectWebWallet, disconnect, signMessage, signTransaction,
  };
}
