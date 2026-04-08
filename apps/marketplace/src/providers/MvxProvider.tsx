"use client";
import { useEffect, useState, ReactNode } from "react";
import { initMvx } from "@/lib/mvx/init";

/**
 * MvxProvider — client-side bootstrap for @multiversx/sdk-dapp.
 * Must wrap the entire app. Renders children only after initMvx completes
 * so hooks from sdk-dapp always have a valid store.
 */
export function MvxProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initMvx()
      .then(() => setReady(true))
      .catch((err) => {
        console.error("[MvxProvider] initMvx failed:", err);
        setReady(true); // still render — degraded mode
      });
  }, []);

  if (!ready) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-bg)",
          color: "var(--color-text-muted)",
          fontSize: "0.875rem",
        }}
      >
        <span className="animate-pulse-dot">Connecting to MultiversX…</span>
      </div>
    );
  }

  return <>{children}</>;
}
