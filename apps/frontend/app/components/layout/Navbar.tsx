'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { WalletButton } from '@/components/wallet/WalletButton';
import { useHealth } from '@/hooks/useHealth';

const NAV = [
  { href: '/app',                   label: 'Marketplace', emoji: '🛒' },
  { href: '/app/dashboard',         label: 'Dashboard',   emoji: '📊' },
  { href: '/app/tasks',             label: 'Tasks',       emoji: '⚡' },
  { href: '/app/providers',         label: 'Providers',   emoji: '🤖' },
  { href: '/app/services/register', label: 'List Service',emoji: '➕' },
];

export function Navbar() {
  const pathname = usePathname();
  const { health } = useHealth(30_000);
  const online = health?.status === 'ok';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/app" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center glow-brand">
            <svg viewBox="0 0 28 28" fill="none" className="w-4 h-4" aria-hidden="true">
              <circle cx="14" cy="14" r="10" stroke="white" strokeWidth="2" />
              <path d="M9 14 L12 11 L16 17 L19 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-semibold text-white tracking-tight">AgentBazaar</span>
          <span className="hidden sm:block text-xs text-brand-400 font-mono px-1.5 py-0.5 rounded bg-brand-900/40 border border-brand-700/30">
            Supernova
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all',
                pathname === item.href || (item.href !== '/app' && pathname?.startsWith(item.href))
                  ? 'bg-brand-600/20 text-brand-400 font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-white/5',
              )}
            >
              <span className="text-xs">{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* MCP health dot */}
          <div
            title={online ? 'MCP Backend Online' : 'MCP Backend Offline'}
            className="hidden sm:flex items-center gap-1.5"
          >
            <span
              className={clsx(
                'w-2 h-2 rounded-full',
                online ? 'bg-emerald-400 animate-pulse' : 'bg-red-400',
              )}
            />
            <span className={clsx('text-xs font-mono', online ? 'text-emerald-400' : 'text-red-400')}>
              {online ? 'MCP' : 'offline'}
            </span>
          </div>

          <span className="hidden sm:block text-xs text-dark-muted font-mono">
            {process.env.NEXT_PUBLIC_MVX_NETWORK || 'devnet'}
          </span>
          <WalletButton />
        </div>
      </div>

      {/* Mobile Nav — horizontally scrollable */}
      <div className="md:hidden flex overflow-x-auto scrollbar-none px-4 pb-2 gap-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all flex-shrink-0',
              pathname === item.href || (item.href !== '/app' && pathname?.startsWith(item.href))
                ? 'bg-brand-600/20 text-brand-400 font-medium'
                : 'text-gray-400 hover:text-white hover:bg-white/5',
            )}
          >
            <span>{item.emoji}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
