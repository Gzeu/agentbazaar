'use client';
import { useState } from 'react';
import { useStaking } from '@/hooks/useStaking';
import { useWalletCtx } from '@/context/WalletContext';

export default function StakingPage() {
  const { connected, connect } = useWalletCtx();
  const { info, loading, error, txHash, stake, unstake } = useStaking();
  const [amount, setAmount] = useState('');

  const TIERS = [
    { tier: 'none',   min: '0',      discount: '0%',  color: 'text-gray-400',   bg: 'bg-gray-800/40' },
    { tier: 'bronze', min: '100',    discount: '10%', color: 'text-orange-400', bg: 'bg-orange-900/20' },
    { tier: 'silver', min: '1,000',  discount: '25%', color: 'text-slate-300',  bg: 'bg-slate-700/30' },
    { tier: 'gold',   min: '10,000', discount: '50%', color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
  ];

  return (
    <main className="pt-20 pb-12 px-4 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Staking $BAZAAR</h1>
        <p className="text-gray-400 text-sm">Stake tokeni pentru fee discounts și reputație boost.</p>
      </div>

      {/* Tier table */}
      <div className="glass border border-white/5 rounded-xl p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Discount Tiers</h2>
        <div className="grid grid-cols-4 gap-2">
          {TIERS.map(t => (
            <div key={t.tier} className={`${t.bg} rounded-lg p-3 text-center border border-white/5 ${
              info?.tier === t.tier ? 'ring-1 ring-brand-500' : ''
            }`}>
              <div className={`text-lg font-bold ${t.color}`}>{t.discount}</div>
              <div className="text-xs text-gray-500 mt-1">{t.min} BAZAAR</div>
              <div className="text-xs text-gray-400 capitalize mt-0.5">{t.tier}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Current position */}
      {connected && info && (
        <div className="glass border border-white/5 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Staked</span>
            <span className="text-lg font-bold font-mono text-brand-300">{info.stakedBalance} BAZAAR</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Fee Discount</span>
            <span className="text-sm font-semibold text-emerald-400">{info.feeDiscountPct}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      {!connected ? (
        <button onClick={connect} className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors">
          Connect Wallet
        </button>
      ) : (
        <div className="glass border border-white/5 rounded-xl p-4 space-y-3">
          <input
            type="number"
            placeholder="Amount BAZAAR"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-dark-surface2 border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => stake(amount)}
              disabled={loading || !amount}
              className="py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
            >
              {loading ? 'Processing…' : 'Stake'}
            </button>
            <button
              onClick={() => unstake(amount)}
              disabled={loading || !amount}
              className="py-2.5 rounded-lg bg-dark-surface2 hover:bg-dark-border disabled:opacity-40 text-gray-300 text-sm font-semibold border border-dark-border transition-colors"
            >
              Unstake
            </button>
          </div>
          {error   && <p className="text-red-400 text-xs">{error}</p>}
          {txHash  && <p className="text-emerald-400 text-xs font-mono break-all">✅ TX: {txHash}</p>}
        </div>
      )}
    </main>
  );
}
