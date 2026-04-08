export type MvxEnvironment = "mainnet" | "devnet" | "testnet";

export const MVX_ENVIRONMENT =
  (process.env.NEXT_PUBLIC_MVX_ENVIRONMENT as MvxEnvironment) ?? "devnet";

export const MVX_API_URL =
  process.env.NEXT_PUBLIC_MVX_API_URL ?? "https://devnet-api.multiversx.com";

export const WALLETCONNECT_V2_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

export const CONTRACT_ADDRESSES = {
  registry:   process.env.NEXT_PUBLIC_REGISTRY_ADDRESS   ?? "",
  escrow:     process.env.NEXT_PUBLIC_ESCROW_ADDRESS     ?? "",
  reputation: process.env.NEXT_PUBLIC_REPUTATION_ADDRESS ?? "",
} as const;

// xPortal / WalletConnect bridge — official MultiversX relay
export const WALLETCONNECT_RELAY_URL = "wss://relay.walletconnect.com";
