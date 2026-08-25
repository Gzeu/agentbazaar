// Mock browser globals not present in node test env
// @vitest-environment jsdom
// Mock browser globals not present in node test env
import { describe, it, beforeEach, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSigner } from "./useSigner";

const storage: Record<string, string> = {};
(globalThis as unknown as { window: { localStorage: { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void; clear(): void; } } }).window = {
  localStorage: {
    getItem: (k: string) => storage[k] ?? null,
    setItem: (k: string, v: string) => { storage[k] = v; },
    removeItem: (k: string) => { delete storage[k]; },
    clear: () => { for (const k of Object.keys(storage)) delete storage[k]; },
  },
};

vi.mock("@multiversx/sdk-extension-provider", () => ({
  ExtensionProvider: {
    getInstance: () => ({
      init: vi.fn().mockResolvedValue(true),
      login: vi.fn().mockResolvedValue("erd1abc"),
      logout: vi.fn().mockResolvedValue(true),
      isConnected: vi.fn().mockResolvedValue(true),
      getAddress: vi.fn().mockResolvedValue("erd1abc"),
      signMessage: vi.fn(async (m: unknown) => m),
      signTransaction: vi.fn(async (t: unknown) => t),
    }),
  },
}));
vi.mock("@multiversx/sdk-web-wallet-provider", () => {
  class WalletProvider {
    login() { return Promise.resolve("https://devnet-wallet.multiversx.com/hook/login"); }
    signMessage() { return Promise.resolve("https://devnet-wallet.multiversx.com/hook/sign"); }
    signTransactions() { return Promise.resolve(undefined); }
    getMessageSignatureFromWalletUrl() { return ""; }
  }
  return { WalletProvider };
});


describe("useSigner", () => {
  beforeEach(() => {
    storage["ab:providerType"] = "";
  });

  it("starts disconnected when nothing is in storage", () => {
    delete storage["ab:providerType"];
    const { result } = renderHook(() => useSigner());
    expect(result.current.providerType).toBeNull();
    expect(result.current.isConnected).toBe(false);
  });

  it("connects with extension and stores provider type", async () => {
    const { result } = renderHook(() => useSigner());
    const addr = await act(async () => result.current.connectExtension());
    expect(addr).toBe("erd1abc");
    expect(result.current.providerType).toBe("extension");
    expect(result.current.isConnected).toBe(true);
    expect(storage["ab:providerType"]).toBe("extension");
  });

  it("signs a message via extension", async () => {
    const { result } = renderHook(() => useSigner());
    await act(async () => { await result.current.connectExtension(); });
    const sig = await act(async () => result.current.signMessage("hello"));
    expect(sig).toBeDefined();
  });

  it("signMessage throws when no provider is selected", async () => {
    delete storage["ab:providerType"];
    const { result } = renderHook(() => useSigner());
    await expect(result.current.signMessage("x")).rejects.toThrow("No wallet provider selected");
  });

  it("disconnect clears provider type and storage", async () => {
    const { result } = renderHook(() => useSigner());
    await act(async () => { await result.current.connectExtension(); });
    await act(async () => { await result.current.disconnect(); });
    expect(result.current.providerType).toBeNull();
    expect(result.current.isConnected).toBe(false);
    expect(storage["ab:providerType"]).toBeUndefined();
  });
});
