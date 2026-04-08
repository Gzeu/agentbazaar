'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Zap, LayoutDashboard, PlusCircle, Activity, ShoppingBag } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { href: '/',           label: 'Marketplace', icon: ShoppingBag },
  { href: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/tasks',      label: 'Tasks',       icon: Activity },
  { href: '/services/register', label: 'List Service', icon: PlusCircle },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center glow-brand">
            <Bot size={16} className="text-white" />
          </div>
          <span className="font-semibold text-white tracking-tight">AgentBazaar</span>
          <span className="text-xs text-brand-400 font-mono px-1.5 py-0.5 rounded bg-brand-900/40 border border-brand-700/30">
            Supernova
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                pathname === href
                  ? 'bg-brand-900/50 text-brand-300 border border-brand-700/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5',
              )}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono">Devnet Live</span>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors flex items-center gap-1.5">
            <Zap size={13} />
            Connect Wallet
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="sm:hidden flex border-t border-white/5 overflow-x-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex-1 flex flex-col items-center gap-1 py-2 text-[10px] transition-colors min-w-[60px]',
              pathname === href ? 'text-brand-400' : 'text-gray-500'
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
