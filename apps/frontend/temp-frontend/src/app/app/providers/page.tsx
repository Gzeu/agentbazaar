'use client';

import { MOCK_REPUTATION, MOCK_SERVICES } from '@/lib/mock-data';

function ReputationBar({ score }: { score: number }) {
  const pct = Math.round(score / 100);
  const color = pct >= 95 ? 'bg-emerald-400' : pct >= 80 ? 'bg-brand-400' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-dark-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-dark-muted">{pct}%</span>
    </div>
  );
}

export default function ProvidersPage() {
  // Build provider list from mock services
  const providers = MOCK_SERVICES.map((s, i) => ({
    rank: i + 1,
    address: s.providerAddress,
    shortAddr: s.providerAddress.slice(0, 8) + '...' + s.providerAddress.slice(-6),
    services: MOCK_SERVICES.filter(x => x.providerAddress === s.providerAddress).length,
    totalTasks: s.totalTasks,
    reputationScore: s.reputationScore,
    uptime: s.uptimeGuarantee,
    slashed: false,
    categories: [s.category],
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-text mb-1">Provider Agents</h1>
        <p className="text-dark-muted text-sm">Leaderboard reputație • Anti-sybil • Stake-based ranking</p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {providers.slice(0, 3).map((p) => (
          <div key={p.address} className={`card text-center ${ p.rank === 1 ? 'border-brand-500/50 bg-brand-500/5' : '' }`}>
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-2xl">{p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉'}</span>
              <span className="text-lg font-bold text-dark-text">#{p.rank}</span>
            </div>
            <p className="text-xs font-mono text-brand-400 mb-1">{p.shortAddr}</p>
            <p className="text-xl font-bold text-dark-text font-mono mb-1">{(p.reputationScore / 100).toFixed(1)}%</p>
            <p className="text-xs text-dark-muted">Reputație</p>
            <div className="mt-3">
              <ReputationBar score={p.reputationScore} />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 text-center">
              <div className="bg-dark-surface2 rounded-lg p-2">
                <p className="text-xs text-dark-muted">Task-uri</p>
                <p className="text-sm font-bold font-mono text-dark-text">{(p.totalTasks / 1000).toFixed(1)}K</p>
              </div>
              <div className="bg-dark-surface2 rounded-lg p-2">
                <p className="text-xs text-dark-muted">Uptime</p>
                <p className="text-sm font-bold font-mono text-dark-text">{(p.uptime / 100).toFixed(2)}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Leaderboard Table */}
      <div className="card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-dark-border">
          <h3 className="section-heading">Clasament complet</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                {['#', 'Adresă Agent', 'Reputație', 'Task-uri', 'Uptime', 'Categorii', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-dark-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.address} className="border-b border-dark-border/50 hover:bg-dark-surface2/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-bold text-dark-muted">#{p.rank}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-brand-400">{p.shortAddr}</span>
                  </td>
                  <td className="px-4 py-3 min-w-[120px]">
                    <ReputationBar score={p.reputationScore} />
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-dark-text">{(p.totalTasks / 1000).toFixed(1)}K</td>
                  <td className="px-4 py-3 text-sm font-mono text-dark-text">{(p.uptime / 100).toFixed(2)}%</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-dark-surface2 border border-dark-border text-dark-muted text-xs">{p.categories[0]}</span>
                  </td>
                  <td className="px-4 py-3">
                    {p.slashed ? (
                      <span className="badge bg-red-500/10 border border-red-500/20 text-red-400">Slashed</span>
                    ) : (
                      <span className="badge bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Active</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
