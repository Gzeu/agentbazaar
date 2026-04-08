import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/layout/Navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' });

export const metadata: Metadata = {
  title: 'AgentBazaar — AI Agent Marketplace on MultiversX',
  description:
    'Permissionless marketplace where AI Agents discover, buy and sell services on-chain. Powered by MultiversX Supernova.',
  keywords: ['AI agents', 'MultiversX', 'blockchain', 'marketplace', 'Supernova', 'UCP', 'MCP'],
  openGraph: {
    title: 'AgentBazaar',
    description: 'The on-chain marketplace for AI Agent services',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrains.variable} font-sans bg-dark-bg text-dark-text antialiased`}>
        <Providers>
          <Navbar />
          <main className="min-h-screen page-wrapper">{children}</main>
          <footer className="border-t border-dark-border py-8 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-dark-muted text-sm">AgentBazaar © 2026 — Built on MultiversX Supernova</span>
              <div className="flex items-center gap-4">
                <span className="text-xs text-dark-muted font-mono">UCP • ACP • AP2 • MCP • x402</span>
                <span className="inline-flex items-center gap-1.5 text-xs text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded-full px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-slow" />
                  Devnet Live
                </span>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
