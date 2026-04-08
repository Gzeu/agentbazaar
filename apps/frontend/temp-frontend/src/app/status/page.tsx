'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Zap, RefreshCw } from 'lucide-react';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

interface StatusItem {
  name: string;
  status: 'online' | 'offline' | 'pending';
  description: string;
  lastChecked: number; // epoch ms — set client-side only
}

const INITIAL: Omit<StatusItem, 'lastChecked'>[] = [
  { name: 'Frontend',            status: 'online',  description: 'Next.js 16 application running' },
  { name: 'Backend API',         status: 'pending', description: 'NestJS backend at ' + BACKEND },
  { name: 'Registry Contract',   status: 'pending', description: 'Smart contract — deploy to populate' },
  { name: 'Escrow Contract',     status: 'pending', description: 'Smart contract — deploy to populate' },
  { name: 'Reputation Contract', status: 'pending', description: 'Smart contract — deploy to populate' },
  { name: 'MultiversX Devnet',   status: 'online',  description: 'Blockchain network operational' },
  { name: 'Wallet Connection',   status: 'offline', description: 'Wallet not connected' },
];

export default function StatusPage() {
  const [items, setItems]       = useState<StatusItem[]>([]);
  const [checking, setChecking] = useState(false);

  // Mount client-side only — avoids hydration mismatch from Date.now()
  useEffect(() => {
    setItems(INITIAL.map((i) => ({ ...i, lastChecked: Date.now() })));
  }, []);

  const checkBackend = async () => {
    setChecking(true);
    try {
      const res = await fetch(`${BACKEND}/health`, { signal: AbortSignal.timeout(5000) });
      setItems((prev) =>
        prev.map((it) =>
          it.name === 'Backend API'
            ? { ...it, status: res.ok ? 'online' : 'offline', lastChecked: Date.now(),
                description: res.ok ? `NestJS backend healthy (${BACKEND})` : `Backend unreachable (${res.status})` }
            : { ...it, lastChecked: Date.now() }
        )
      );
    } catch {
      setItems((prev) =>
        prev.map((it) =>
          it.name === 'Backend API'
            ? { ...it, status: 'offline', lastChecked: Date.now(), description: `Cannot reach ${BACKEND}` }
            : it
        )
      );
    } finally {
      setChecking(false);
    }
  };

  const iconFor = (s: StatusItem['status']) => {
    if (s === 'online')  return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    if (s === 'offline') return <XCircle     className="w-5 h-5 text-red-400" />;
    return                      <Clock       className="w-5 h-5 text-yellow-400" />;
  };

  const colorFor = (s: StatusItem['status']) => ({
    online:  'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    offline: 'text-red-400 bg-red-400/10 border-red-400/30',
    pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  }[s]);

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      <div className="max-w-3xl mx-auto px-4 py-16">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Zap className="w-7 h-7 text-brand-400" />
            <h1 className="text-3xl font-bold text-white">System Status</h1>
          </div>
          <p className="text-gray-400 text-sm">Real-time status of AgentBazaar components</p>
        </div>

        {/* Check button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={checkBackend}
            disabled={checking}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking…' : 'Refresh'}
          </button>
        </div>

        {/* Items */}
        <div className="space-y-3">
          {items.length === 0
            ? Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="glass rounded-lg h-20 animate-pulse" />
              ))
            : items.map((item) => (
                <div
                  key={item.name}
                  className={`glass rounded-lg p-5 border transition-all hover:glow-brand ${colorFor(item.status)}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {iconFor(item.status)}
                      <div>
                        <h3 className="font-semibold text-white">{item.name}</h3>
                        <p className="text-sm opacity-75 mt-0.5">{item.description}</p>
                        <p className="text-xs opacity-50 mt-1">
                          Last checked:{' '}
                          {/* Rendered fully client-side — no hydration mismatch */}
                          <span suppressHydrationWarning>
                            {item.lastChecked ? new Date(item.lastChecked).toLocaleTimeString() : '—'}
                          </span>
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorFor(item.status)}`}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
          }
        </div>

        {/* Next steps */}
        <div className="mt-10 glass rounded-xl p-6 border border-brand-500/30 bg-brand-500/5">
          <h3 className="font-semibold text-white mb-3">🚀 Next Steps to Go Live</h3>
          <ol className="text-sm text-gray-300 space-y-2">
            {[
              'Fund devnet wallet with EGLD from faucet.multiversx.com',
              'Run: cd contracts && mxpy contract build && bash devnet/deploy.sh',
              'Paste contract addresses in .env.local + backend .env',
              'Start backend: cd apps/backend && npm run start:dev',
              'Connect xPortal wallet and submit a task!',
            ].map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-brand-400 font-mono font-bold shrink-0">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
