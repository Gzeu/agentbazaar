import Link from 'next/link';
import { useRouter } from 'next/router';
import { Bot, Zap, LayoutDashboard, PlusCircle, Activity } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { href: '/', label: 'Marketplace', icon: LayoutDashboard },
  { href: '/services/register', label: 'List Service', icon: PlusCircle },
  { href: '/tasks', label: 'My Tasks', icon: Activity },
];

export function Navbar() {
  const router = useRouter();

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
        <div className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                router.pathname === href
                  ? 'bg-brand-900/50 text-brand-300 border border-brand-700/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5',
              )}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </div>

        {/* Network badge + Connect */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <Zap size={12} className="animate-pulse" />
            <span className="font-mono">Supernova</span>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors">
            Connect Wallet
          </button>
        </div>
      </div>
    </nav>
  );
}
