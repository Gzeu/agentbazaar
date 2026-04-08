'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { LayoutGrid, Zap, BarChart2, Database, Menu, X } from 'lucide-react';
import { useState } from 'react';

const NAV = [
  { href: '/', label: 'Home', icon: LayoutGrid },
  { href: '/services', label: 'Services', icon: Database },
  { href: '/tasks', label: 'Tasks', icon: Zap },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart2 },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-dark-bg/80 backdrop-blur-md border-b border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="AgentBazaar">
              <rect width="28" height="28" rx="8" fill="#0694a2" opacity="0.15"/>
              <path d="M7 21L14 7L21 21" stroke="#0694a2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.5 16.5H18.5" stroke="#0694a2" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="14" cy="7" r="1.8" fill="#16bdca"/>
            </svg>
            <span className="font-bold text-dark-text text-lg tracking-tight group-hover:text-brand-400 transition-colors">
              Agent<span className="text-brand-400">Bazaar</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  pathname === href
                    ? 'bg-brand-500/10 text-brand-400'
                    : 'text-dark-muted hover:text-dark-text hover:bg-dark-surface',
                )}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>
              Supernova
            </div>
            <button className="btn-secondary text-xs px-3 py-1.5">
              Connect Wallet
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden btn-ghost p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="md:hidden pb-4 animate-slide-up">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-brand-500/10 text-brand-400'
                    : 'text-dark-muted hover:text-dark-text',
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
