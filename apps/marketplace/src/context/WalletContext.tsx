"use client";
/**
 * WalletContext — thin adaptor over @multiversx/sdk-dapp hooks.
 *
 * Falls back to a mock implementation when sdk-dapp is not yet
 * initialized (SSR / pre-hydration) so the rest of the UI stays stable.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { servicesApi, auth as apiAuth } from "@/lib/api";
import { useSigner, type ProviderType } from "@/hooks/useSigner";
import type { Transaction, SignableMessage } from "@multiversx/sdk-core";

interface WalletState {
  address: string | null;
  balance: string;
  connected: boolean;
  connecting: boolean;
  showModal: boolean;
  token: string | null;
  connect: () => void;
  openModal: () => void;
  closeModal: () => void;
  disconnect: () => void;
  shortAddress: string;
  network: string;
  signer: {
    providerType: ProviderType | null;
    signMessage: (msg: string) => Promise<SignableMessage>;
    signTransaction: (tx: Transaction) => Promise<Transaction>;
    connectExtension: () => Promise<string>;
    connectWebWallet: (cb?: string) => Promise<unknown>;
    lastSignature: string | null;
  };
  // Internal setters exposed for components that need to push state
  // (e.g. ConnectModal after Extension login).
  setAddress: (addr: string) => void;
}

const WalletContext = createContext<WalletState>({
  address: null,
  balance: "0",
  connected: false,
  connecting: false,
  showModal: false,
  token: null,
  connect: () => {},
  openModal: () => {},
  closeModal: () => {},
  disconnect: () => {},
  shortAddress: "",
  network: "devnet",
  signer: {
    providerType: null,
    signMessage: async () => { throw new Error("WalletProvider not initialised"); },
    signTransaction: async () => { throw new Error("WalletProvider not initialised"); },
    connectExtension: async () => { throw new Error("WalletProvider not initialised"); },
    connectWebWallet: async () => { throw new Error("WalletProvider not initialised"); },
    lastSignature: null,
  },
  setAddress: () => {},
});

function formatBalance(raw: string): string {
  try {
    const val = BigInt(raw);
    const egld = Number(val) / 1e18;
    return egld.toFixed(4);
  } catch {
    return "0";
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState("0");
  const [connecting, setConnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [network, setNetwork] = useState("devnet");
  const [token, setToken] = useState<string | null>(apiAuth.getToken());
  const signer = useSigner();

  // When a wallet address appears, mint (or reuse) an API JWT so all
  // backend calls are authenticated. No-op in SSR / disconnected mode.
  useEffect(() => {
    if (!address || token) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await servicesApi.authLogin(address, true);
        if (!cancelled && res?.access_token) {
          apiAuth.setToken(res.access_token);
          setToken(res.access_token);
        }
      } catch (e) {
        console.error("[WalletContext] JWT login failed:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address, token]);

  // Hydrate from sdk-dapp store after client mount
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const { getAccountProvider } = await import(
          /* webpackIgnore: true */ "@multiversx/sdk-dapp/out/providers/accountProvider" as string
        );
        const { getStore } = await import(
          /* webpackIgnore: true */ "@multiversx/sdk-dapp/out/reduxStore/store" as string
        );
        const store = getStore();
        if (!store) return;

        const syncFromStore = () => {
          const state = store.getState();
          const acct = state?.account?.account;
          const net = state?.networkConfig?.network;
          if (acct?.address) {
            setAddress(acct.address);
            setBalance(formatBalance(acct.balance ?? "0"));
          } else {
            setAddress(null);
            setBalance("0");
          }
          if (net?.id) setNetwork(net.id);
        };

        syncFromStore();
        const unsubscribe = store.subscribe(syncFromStore);
        cleanup = unsubscribe;
      } catch {
        // sdk-dapp not ready — degraded / SSR mode, keep mock state
      }
    })();

    return () => cleanup?.();
  }, [setAddress, setBalance, setNetwork]);

  // Dev / degraded-mode fallback: ConnectModal emits `dev-address`
  // to simulate a wallet connect without an installed provider.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      const dev = window.localStorage.getItem("ab:devAddress");
      if (dev) {
        setAddress(dev);
        setBalance("99999");
        setNetwork("testnet");
      }
    };
    window.addEventListener("dev-address", handler);
    return () => window.removeEventListener("dev-address", handler);
  }, [setAddress, setBalance, setNetwork]);

  const openModal = useCallback(() => setShowModal(true), []);
  const closeModal = useCallback(() => setShowModal(false), []);
  /** Connect opens the wallet modal (extension / WebWallet). */
  const connect = useCallback(() => setShowModal(true), []);

  const disconnect = useCallback(async () => {
    try {
      const { logout } = await import(
        /* webpackIgnore: true */ "@multiversx/sdk-dapp/out/utils/logout" as string
      );
      await logout("/");
    } catch {
      setAddress(null);
      setBalance("0");
    } finally {
      apiAuth.clearToken();
      setToken(null);
    }
  }, []);

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : "";

  return (
    <WalletContext.Provider
      value={{
        address,
        balance,
        connected: !!address,
        connecting,
        showModal,
        token,
        openModal,
        connect,
        closeModal,
        disconnect,
        shortAddress,
        network,
        signer: {
          providerType: signer.providerType,
          signMessage: signer.signMessage,
          signTransaction: signer.signTransaction,
          connectExtension: signer.connectExtension,
          connectWebWallet: signer.connectWebWallet,
          lastSignature: signer.lastSignature,
        },
        setAddress,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
