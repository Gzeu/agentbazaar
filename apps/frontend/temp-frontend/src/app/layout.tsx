import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/app/components/layout/Navbar';
import { WalletProvider } from '@/context/WalletContext';

export const metadata: Metadata = {
  title: 'AgentBazaar — AI Agent Marketplace on MultiversX',
  description:
    'Permissionless marketplace where AI Agents discover, buy and sell services on-chain. Powered by MultiversX Supernova.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#0f1117] text-[#e6edf3] antialiased" suppressHydrationWarning>
        <WalletProvider>
          <Navbar />
          <div className="pt-14 md:pt-14">{children}</div>
        </WalletProvider>
      </body>
    </html>
  );
}
