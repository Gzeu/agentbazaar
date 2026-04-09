'use client';

import { useState } from 'react';
import { useWalletCtx } from '@/context/WalletContext';
import { useDao } from '@/hooks/useDao';
import {
  Vote, Users, Landmark, RefreshCw,
  ExternalLink, AlertCircle, Wallet, Plus, CheckCircle
} from 'lucide-react';

const EXPLORER = process.env.NEXT_PUBLIC_MVX_EXPLORER ?? 'https://devnet-explorer.multiversx.com';

const STATUS_STYLE = {
  active:   'bg-brand-500/20   text-brand-400   border-brand-500/30',
  executed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  expired:  'bg-gray-800       text-gray-500     border-gray-700',
  defeated: 'bg-red-500/20     text-red-400      border-red-500/30',
};

function timeLeft(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  if (d > 0) return `${d}d ${h}h left`;
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

export default function DAOPage() {
  const { connected, connect } = useWalletCtx();
  const { proposals, stats, myVotes, loading, error, txHash, vote, createProposal, refresh, statusOf } = useDao();

  const [newDesc,      setNewDesc]      = useState('');
  const [duration,     setDuration]     = useState(3);
  const [showForm,     setShowForm]     = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [votingId,     setVotingId]     = useState<number | null>(null);

  const handleCreate = async () => {
    if (!newDesc.trim()) return;
    setSubmitting(true);
    await createProposal(newDesc, duration);
    setSubmitting(false);
    setNewDesc('');
    setShowForm(false);
  };

  const handleVote = async (id: number, inFavor: boolean) => {
    setVotingId(id);
    await vote(id, inFavor);
    setVotingId(null);
  };

  return (
    <main className="min-h-screen pb-12 px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">AgentBazaar DAO</h1>
            <p className="text-gray-400 text-sm mt-1">Governance pentru protocol. Votează cu BAZAAR staked.</p>
          </div>
          <button onClick={refresh} disabled={loading}
            className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-30">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
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
            <span className="flex items-center gap-2"><CheckCircle size={14} /> Transaction sent</span>
            <a href={`${EXPLORER}/transactions/${txHash}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs hover:underline">
              View on explorer <ExternalLink size={11} />
            </a>
          </div>
        )}

        {/* Global stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Proposals',    value: stats ? String(stats.totalProposals) : '—', icon: Vote,     color: 'text-brand-400' },
            { label: 'Voters',       value: stats ? String(stats.totalVoters)    : '—', icon: Users,    color: 'text-blue-400' },
            { label: 'Treasury',     value: stats ? `${stats.treasuryEgld} EGLD` : '—', icon: Landmark, color: 'text-yellow-400' },
            { label: 'Quorum',       value: stats ? `${stats.quorumRequired}K`    : '—', icon: CheckCircle, color: 'text-emerald-400' },
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

        {/* Create proposal */}
        {connected && (
          <div className="glass rounded-xl overflow-hidden">
            <button
              onClick={() => setShowForm(v => !v)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2"><Plus size={14} /> Propunere nouă</span>
              <span className="text-xs text-gray-600">{showForm ? '▴ collapse' : '▾ expand'}</span>
            </button>
            {showForm && (
              <div className="px-5 pb-5 space-y-3 border-t border-white/5">
                <div className="pt-3">
                  <label className="block text-xs text-gray-400 mb-1.5">Descriere propunere</label>
                  <textarea
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Ex: Reduce marketplace fee de la 2.5% la 2.0%"
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-500/50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Durata vot (zile)</label>
                  <div className="flex gap-2">
                    {[1, 3, 7, 14].map(d => (
                      <button key={d} onClick={() => setDuration(d)}
                        className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                          duration === d
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'border-white/10 text-gray-400 hover:text-white'
                        }`}>
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={submitting || !newDesc.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
                >
                  {submitting
                    ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Trimit…</>
                    : <><Vote size={14} /> Creează propunere</>
                  }
                </button>
              </div>
            )}
          </div>
        )}

        {/* No wallet */}
        {!connected && (
          <div className="glass rounded-xl p-8 text-center">
            <Wallet size={28} className="mx-auto text-gray-600 mb-3" />
            <p className="text-white font-semibold mb-1">Connect wallet pentru a vota</p>
            <p className="text-sm text-gray-500 mb-4">Ai nevoie de BAZAAR staked pentru voting power.</p>
            <button onClick={connect}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors">
              Connect Wallet
            </button>
          </div>
        )}

        {/* Proposals list */}
        {loading && proposals.length === 0 ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="glass rounded-xl h-28 animate-pulse" />)}
          </div>
        ) : proposals.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-sm">No proposals yet.</div>
        ) : (
          <div className="space-y-4">
            {proposals.map(p => {
              const status  = statusOf(p);
              const total   = p.yesVotes + p.noVotes || 1;
              const yesPct  = Math.round((p.yesVotes / total) * 100);
              const hasVoted = myVotes.has(p.id);
              const isActive = status === 'active';
              const isVoting = votingId === p.id;

              return (
                <div key={p.id} className="glass rounded-xl p-5 space-y-4">
                  {/* Top */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-600">#{p.id}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_STYLE[status]}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                        {isActive && (
                          <span className="text-[10px] text-gray-500">{timeLeft(p.expiresAt)}</span>
                        )}
                      </div>
                      <p className="text-sm text-white font-medium">{p.description}</p>
                    </div>
                    {p.txHash && (
                      <a href={`${EXPLORER}/transactions/${p.txHash}`} target="_blank" rel="noreferrer"
                        className="text-gray-600 hover:text-brand-400 transition-colors shrink-0">
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>

                  {/* Vote bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-emerald-400">✔ {(p.yesVotes / 1000).toFixed(0)}K ({yesPct}%)</span>
                      <span className="text-red-400">✘ {(p.noVotes / 1000).toFixed(0)}K ({100 - yesPct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${yesPct}%` }} />
                    </div>
                    {p.quorum > 0 && (
                      <div className="text-[10px] text-gray-600 mt-1">
                        Quorum: {p.yesVotes.toLocaleString()} / {p.quorum.toLocaleString()} votes
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-mono text-gray-600">
                      by <a href={`${EXPLORER}/accounts/${p.createdBy}`} target="_blank" rel="noreferrer"
                        className="hover:text-brand-400 transition-colors">
                        {p.createdBy?.slice(0, 10)}…
                      </a>
                    </div>
                    {isActive && connected && !hasVoted && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVote(p.id, true)}
                          disabled={isVoting}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-900/30 hover:bg-emerald-800/40 text-emerald-400 text-xs border border-emerald-700/30 transition-colors disabled:opacity-50"
                        >
                          {isVoting ? <span className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" /> : '✔'} Da
                        </button>
                        <button
                          onClick={() => handleVote(p.id, false)}
                          disabled={isVoting}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-800/40 text-red-400 text-xs border border-red-700/30 transition-colors disabled:opacity-50"
                        >
                          {isVoting ? <span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> : '✘'} Nu
                        </button>
                      </div>
                    )}
                    {hasVoted && <span className="text-xs text-gray-500">Votat ✅</span>}
                    {!connected && isActive && <span className="text-xs text-gray-600">Connect to vote</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
