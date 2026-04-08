"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface WalletState {
  address: string | null;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  shortAddress: string;
}

const WalletContext = createContext<WalletState>({
  address: null,
  connected: false,
  connecting: false,
  connect: async () => {},
  disconnect: () => {},
  shortAddress: "",
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    setConnecting(true);
    // In production: integrate @multiversx/sdk-dapp DappProvider + useGetLoginInfo
    // For devnet demo: simulate wallet connect with a mock address
    await new Promise((r) => setTimeout(r, 900));
    setAddress("erd1qqqqqqqqqqqqqpgqd77fnev2sthnczp2lnfx0y5jdycynjfhzzgq6p3rax");
    setConnecting(false);
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : "";

  return (
    <WalletContext.Provider value={{ address, connected: !!address, connecting, connect, disconnect, shortAddress }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
