'use client';
import { useState } from 'react';
import { useWalletCtx } from '@/context/WalletContext';

interface Proposal {
  id: number;
  description: string;
  yesVotes: number;
  noVotes: number;
  executed: boolean;
  expiresAt: string;
}

const MOCK_PROPOSALS: Proposal[] = [
  { id: 1, description: 'Reduce marketplace fee from 2.5% to 2.0%', yesVotes: 1200000, noVotes: 340000, executed: false, expiresAt: new Date(Date.now() + 2 * 86400000).toISOString() },
  { id: 2, description: 'Allocate 10 EGLD treasury to bug bounty program', yesVotes: 980000, noVotes: 120000, executed: false, expiresAt: new Date(Date.now() + 5 * 86400000).toISOString() },
  { id: 3, description: 'Add orchestration category to Registry whitelist', yesVotes: 2100000, noVotes: 450000, executed: true, expiresAt: new Date(Date.now() - 86400000).toISOString() },
];

export default function DAOPage() {
  const { connected, connect } = useWalletCtx();
  const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS);
  const [newDesc,   setNewDesc]   = useState('');
  const [voted,     setVoted]     = useState<Set<number>>(new Set());

  const handleVote = (id: number, inFavor: boolean) => {
    if (voted.has(id)) return;
    setProposals(prev => prev.map(p =>
      p.id === id
        ? { ...p, yesVotes: inFavor ? p.yesVotes + 1000 : p.yesVotes, noVotes: !inFavor ? p.noVotes + 1000 : p.noVotes }
        : p
    ));
    setVoted(prev => new Set([...prev, id]));
  };

  const handleCreate = () => {
    if (!newDesc.trim()) return;
    const p: Proposal = {
      id:          proposals.length + 1,
      description: newDesc.trim(),
      yesVotes:    0,
      noVotes:     0,
      executed:    false,
      expiresAt:   new Date(Date.now() + 3 * 86400000).toISOString(),
    };
    setProposals(prev => [p, ...prev]);
    setNewDesc('');
  };

  return (
    <main className="pt-20 pb-12 px-4 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">AgentBazaar DAO</h1>
        <p className="text-gray-400 text-sm">Governance pentru protocol. Votează cu BAZAAR staked.</p>
      </div>

      {/* Create proposal */}
      {connected && (
        <div className="glass border border-white/5 rounded-xl p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-2">Propunere nouă</h2>
          <textarea
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Descrie propunerea..."
            rows={2}
            className="w-full bg-dark-surface2 border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-500 resize-none mb-2"
          />
          <button
            onClick={handleCreate}
            disabled={!newDesc.trim()}
            className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
          >
            Creează propunere
          </button>
        </div>
      )}

      {/* Proposals */}
      <div className="space-y-3">
        {proposals.map(p => {
          const total   = p.yesVotes + p.noVotes || 1;
          const yesPct  = Math.round((p.yesVotes / total) * 100);
          const expires = new Date(p.expiresAt);
          const expired = expires < new Date();
          return (
            <div key={p.id} className="glass border border-white/5 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm text-white font-medium max-w-md">{p.description}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  p.executed ? 'bg-emerald-900/30 text-emerald-400 border-emerald-700/30' :
                  expired    ? 'bg-gray-800 text-gray-500 border-gray-700' :
                               'bg-brand-900/30 text-brand-400 border-brand-700/30'
                }`}>
                  {p.executed ? 'Executed' : expired ? 'Expired' : 'Active'}
                </span>
              </div>
              {/* Vote bar */}
              <div className="h-1.5 rounded-full bg-dark-surface2 mb-3 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${yesPct}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-4 text-xs text-gray-400">
                  <span className="text-emerald-400">✔ {(p.yesVotes / 1000).toFixed(0)}K</span>
                  <span className="text-red-400">✘ {(p.noVotes / 1000).toFixed(0)}K</span>
                  <span>{yesPct}% in favoare</span>
                </div>
                {!expired && !p.executed && connected && !voted.has(p.id) && (
                  <div className="flex gap-1.5">
                    <button onClick={() => handleVote(p.id, true)}  className="px-3 py-1 rounded-lg bg-emerald-900/30 hover:bg-emerald-800/40 text-emerald-400 text-xs border border-emerald-700/30 transition-colors">Da</button>
                    <button onClick={() => handleVote(p.id, false)} className="px-3 py-1 rounded-lg bg-red-900/30 hover:bg-red-800/40 text-red-400 text-xs border border-red-700/30 transition-colors">Nu</button>
                  </div>
                )}
                {voted.has(p.id) && <span className="text-xs text-gray-500">Votat ✅</span>}
              </div>
            </div>
          );
        })}
      </div>

      {!connected && (
        <div className="mt-6 text-center">
          <button onClick={connect} className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors">
            Connect Wallet pentru a vota
          </button>
        </div>
      )}
    </main>
  );
}
