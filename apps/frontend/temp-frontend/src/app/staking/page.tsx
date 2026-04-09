'use client';

import { useState } from 'react';
import { useStaking } from '@/hooks/useStaking';
import { useWalletCtx } from '@/context/WalletContext';
import {
  Coins, TrendingUp, ShieldCheck, Zap,
  ExternalLink, RefreshCw, AlertCircle, Wallet
} from 'lucide-react';

const EXPLORER = process.env.NEXT_PUBLIC_MVX_EXPLORER ?? 'https://devnet-explorer.multiversx.com';

const TIERS = [
  { tier: 'none'   as const, min: '0',      discount: '0%',  repBoost: '+0%',  color: 'text-gray-400',   ring: '', bg: 'bg-gray-800/40' },
  { tier: 'bronze' as const, min: '100',    discount: '10%', repBoost: '+3%',  color: 'text-orange-400', ring: 'ring-orange-500/40', bg: 'bg-orange-900/20' },
  { tier: 'silver' as const, min: '1,000',  discount: '25%', repBoost: '+5%',  color: 'text-slate-300',  ring: 'ring-slate-400/40',  bg: 'bg-slate-700/30' },
  { tier: 'gold'   as const, min: '10,000', discount: '50%', repBoost: '+10%', color: 'text-yellow-400', ring: 'ring-yellow-500/40', bg: 'bg-yellow-900/20' },
];

export default function StakingPage() {
  const { connected, connect } = useWalletCtx();
  const { info, loading, error, txHash, stake, unstake, refresh } = useStaking();
  const [amount, setAmount] = useState('');

  const setMax = (src: 'wallet' | 'staked') => {
    if (!info) return;
    setAmount(src === 'wallet' ? info.walletBalance : info.stakedBalance);
  };

  return (
    <main className="min-h-screen pb-12 px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Staking $BAZAAR</h1>
            <p className="text-gray-400 text-sm mt-1">Stake tokens pentru fee discounts, reputation boost și DAO voting power.</p>
          </div>
          {connected && (
            <button
              onClick={refresh}
              disabled={loading}
              className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-30"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* TX success */}
        {txHash && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <span>✅ Transaction sent</span>
            <a
              href={`${EXPLORER}/transactions/${txHash}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs hover:underline"
            >
              View on explorer <ExternalLink size={11} />
            </a>
          </div>
        )}

        {/* Global stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Staked',   value: info ? `${Number(info.totalStaked).toLocaleString()} BAZAAR` : '—', icon: Coins,       color: 'text-brand-400' },
            { label: 'APY',            value: info?.apy ?? '—',                                                    icon: TrendingUp,  color: 'text-emerald-400' },
            { label: 'Your Discount',  value: info?.feeDiscountPct ?? '—',                                         icon: ShieldCheck, color: 'text-yellow-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass rounded-xl p-4 text-center">
              <Icon size={16} className={`mx-auto mb-2 ${color}`} />
              <div className={`text-lg font-bold font-mono ${color}`}>
                {loading ? <span className="animate-pulse">—</span> : value}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Tier table */}
        <div className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Discount Tiers</h2>
          <div className="grid grid-cols-4 gap-2">
            {TIERS.map(t => {
              const active = info?.tier === t.tier;
              return (
                <div key={t.tier} className={`${
                  t.bg
                } rounded-xl p-3 text-center border border-white/5 transition-all ${
                  active ? `ring-1 ${t.ring} scale-105` : ''
                }`}>
                  <div className={`text-xl font-bold ${t.color}`}>{t.discount}</div>
                  <div className="text-[10px] text-gray-500 mt-1">{t.min} BAZAAR</div>
                  <div className={`text-xs capitalize mt-1 font-medium ${t.color}`}>{t.tier}</div>
                  <div className="text-[10px] text-gray-500 mt-1">Rep {t.repBoost}</div>
                  {active && (
                    <div className="mt-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">current</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Not connected */}
        {!connected ? (
          <div className="glass rounded-xl p-10 text-center">
            <Wallet size={32} className="mx-auto text-gray-600 mb-3" />
            <p className="text-white font-semibold mb-3">Wallet not connected</p>
            <button
              onClick={connect}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            {/* Current position */}
            {info && (
              <div className="glass rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-300 mb-4">Your Position</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Staked</div>
                    <div className="text-2xl font-bold font-mono text-brand-300">
                      {loading ? '—' : info.stakedBalance}
                    </div>
                    <div className="text-xs text-gray-500">BAZAAR</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Wallet Balance</div>
                    <div className="text-2xl font-bold font-mono text-white">
                      {loading ? '—' : info.walletBalance}
                    </div>
                    <div className="text-xs text-gray-500">BAZAAR</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Fee Discount</div>
                    <div className="text-lg font-bold text-emerald-400">{info.feeDiscountPct}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Reputation Boost</div>
                    <div className="text-lg font-bold text-yellow-400">{info.reputationBoost}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Stake / Unstake */}
            <div className="glass rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-300">Stake / Unstake</h2>

              {/* Amount input */}
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  placeholder="Amount BAZAAR"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-500/50 pr-24"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button
                    onClick={() => setMax('wallet')}
                    className="text-[10px] px-2 py-1 rounded-lg bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-colors"
                  >MAX</button>
                </div>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 flex-wrap">
                {['100', '500', '1000', '5000', '10000'].map(v => (
                  <button
                    key={v}
                    onClick={() => setAmount(v)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                  >
                    {Number(v).toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => stake(amount)}
                  disabled={loading || !amount || Number(amount) <= 0}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
                >
                  {loading
                    ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</>
                    : <><Zap size={14} /> Stake</>
                  }
                </button>
                <button
                  onClick={() => unstake(amount)}
                  disabled={loading || !amount || Number(amount) <= 0}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-gray-300 text-sm font-semibold border border-white/10 transition-colors"
                >
                  {loading
                    ? <><span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> Processing…</>
                    : <><Coins size={14} /> Unstake</>
                  }
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
