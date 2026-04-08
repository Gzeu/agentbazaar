/**
 * initMvx — call once on the client side to bootstrap sdk-dapp.
 * Wraps the sdk-dapp initApp pattern for Next.js App Router.
 *
 * Usage: call inside a "use client" component that mounts at root level,
 * e.g. MvxProvider.tsx
 */
import {
  MVX_ENVIRONMENT,
  MVX_API_URL,
  WALLETCONNECT_V2_PROJECT_ID,
  WALLETCONNECT_RELAY_URL,
} from "./config";

let initialized = false;

export async function initMvx(): Promise<void> {
  if (initialized) return;
  initialized = true;

  // Dynamic import keeps sdk-dapp out of the server bundle
  const { initApp } = await import("@multiversx/sdk-dapp/out/utils/app/initApp");

  await initApp({
    storage: {
      getStorageCallback: () => sessionStorage,
    },
    config: {
      environment: MVX_ENVIRONMENT as "devnet" | "mainnet" | "testnet",
      customNetworkConfig: {
        id: MVX_ENVIRONMENT,
        name: `MultiversX ${MVX_ENVIRONMENT}`,
        apiAddress: MVX_API_URL,
        walletConnectV2ProjectId: WALLETCONNECT_V2_PROJECT_ID,
        walletConnectDeepLink:
          "https://maiar.page.link/?apn=com.elrond.maiar&isi=1519405832&ibi=com.elrond.maiar&link=https://xportal.com/",
      },
    },
  });
}
