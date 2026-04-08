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

interface WalletState {
  address: string | null;
  balance: string; // formatted EGLD, e.g. "1.23"
  connected: boolean;
  connecting: boolean;
  showModal: boolean;
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

  // Hydrate from sdk-dapp store after client mount
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const { getAccountProvider } = await import(
          "@multiversx/sdk-dapp/out/providers/accountProvider"
        );
        const { getStore } = await import(
          "@multiversx/sdk-dapp/out/reduxStore/store"
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

  const disconnect = useCallback(async () => {
    try {
      const { logout } = await import(
        "@multiversx/sdk-dapp/out/utils/logout"
      );
      await logout("/");
    } catch {
      setAddress(null);
      setBalance("0");
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
        openModal,
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
