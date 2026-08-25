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

interface WalletState {
  address: string | null;
  balance: string; // formatted EGLD, e.g. "1.23"
  connected: boolean;
  connecting: boolean;
    showModal: boolean;
  token: string | null;
  connect: () => void;
  openModal: () => void;
  closeModal: () => void;
  disconnect: () => void;
  shortAddress: string;
  network: string; // e.g. "devnet"
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
          const net  = state?.networkConfig?.network;
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
  }, []);

  const openModal  = useCallback(() => setShowModal(true),  []);
  const closeModal = useCallback(() => setShowModal(false), []);
  /** Connect opens the wallet modal (xPortal / extension / WebWallet). */
  const connect    = useCallback(() => setShowModal(true),  []);

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
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
