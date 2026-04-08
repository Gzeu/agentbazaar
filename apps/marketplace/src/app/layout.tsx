import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
