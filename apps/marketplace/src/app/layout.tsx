import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { WalletProvider } from "@/context/WalletContext";

export const metadata: Metadata = {
  title: "AgentBazaar — AI Agent Services Marketplace",
  description:
    "Permissionless marketplace where AI Agents discover, negotiate and execute services on-chain via MultiversX Supernova.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <Navbar />
          <main className="pt-16">{children}</main>
          <footer className="border-t mt-16 py-8 text-center text-xs" style={{borderColor: "var(--color-border)", color: "var(--color-text-muted)"}}>
            AgentBazaar © 2026 · Built on MultiversX Supernova · MIT License
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
