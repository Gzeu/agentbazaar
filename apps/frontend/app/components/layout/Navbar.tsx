'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { WalletButton } from '@/components/wallet/WalletButton';

const NAV = [
  { href: '/',                  label: 'Marketplace', emoji: '🛒' },
  { href: '/dashboard',         label: 'Dashboard',   emoji: '📊' },
  { href: '/tasks',             label: 'Tasks',       emoji: '⚡' },
  { href: '/providers',         label: 'Providers',   emoji: '🤖' },
  { href: '/services/register', label: 'List Service',emoji: '➕' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center glow-brand">
            <span className="text-white text-xs font-bold">AB</span>
          </div>
          <span className="font-semibold text-white tracking-tight">AgentBazaar</span>
          <span className="hidden sm:block text-xs text-brand-400 font-mono px-1.5 py-0.5 rounded bg-brand-900/40 border border-brand-700/30">Supernova</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5">
          {NAV.map(({ href, label, emoji }) => (
            <Link key={href} href={href} className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
              pathname === href
                ? 'bg-brand-900/50 text-brand-300 border border-brand-700/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5',
            )}>
              <span className="text-xs">{emoji}</span>{label}
            </Link>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono">Devnet</span>
          </div>
          <WalletButton />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden flex border-t border-white/5 overflow-x-auto">
        {NAV.map(({ href, label, emoji }) => (
          <Link key={href} href={href} className={clsx(
            'flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors min-w-[60px]',
            pathname === href ? 'text-brand-400' : 'text-gray-500'
          )}>
            <span className="text-base">{emoji}</span>
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
