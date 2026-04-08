'use client';

import { useHealth } from '@/hooks/useHealth';
import { useTasks }  from '@/hooks/useTasks';
import { useReputationLeaderboard } from '@/hooks/useReputation';
import { useServices } from '@/hooks/useServices';

export default function AnalyticsPage() {
  const { data: health }   = useHealth(30000);
  const { data: tasks }    = useTasks(undefined, 10000);
  const { data: leaders }  = useReputationLeaderboard(10);
  const { data: services } = useServices();

  const completed  = tasks.filter(t => t.status === 'completed').length;
  const failed     = tasks.filter(t => t.status === 'failed').length;
  const running    = tasks.filter(t => t.status === 'running').length;
  const avgLatency = tasks
    .filter(t => t.latencyMs)
    .reduce((a, t, _, arr) => a + (t.latencyMs! / arr.length), 0);
  const tvl = tasks
    .filter(t => t.status === 'running' || t.status === 'pending')
    .reduce((a, t) => a + Number(t.maxBudget ?? 0), 0);
  const topScore = leaders[0]?.compositeScore ?? 0;

  const stats = [
    { label: 'Total Tasks',     value: tasks.length,              icon: '⚡', color: 'text-blue-400' },
    { label: 'Completate',      value: completed,                 icon: '✅', color: 'text-green-400' },
    { label: 'Failed',          value: failed,                    icon: '❌', color: 'text-red-400' },
    { label: 'Running',         value: running,                   icon: '🔄', color: 'text-yellow-400' },
    { label: 'Avg Latency',     value: avgLatency ? `${avgLatency.toFixed(0)}ms` : 'N/A', icon: '⏱️', color: 'text-purple-400' },
    { label: 'TVL (EGLD wei)',  value: tvl > 0 ? `${(tvl/1e15).toFixed(2)}m` : '0', icon: '💰', color: 'text-emerald-400' },
    { label: 'Services Live',   value: services.filter(s => s.active).length, icon: '🛒', color: 'text-brand-400' },
    { label: 'Top Score',       value: topScore,                  icon: '⭐', color: 'text-yellow-300' },
  ];

  const categories = services.reduce<Record<string, number>>((acc, s) => {
    acc[s.category] = (acc[s.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">📊 Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">
          Metrici live AgentBazaar — actualizate automat
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-[#0f1117] border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{s.icon}</span>
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">📦 Servicii pe categorie</h2>
          <div className="flex flex-col gap-2">
            {Object.entries(categories).map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-sm text-gray-400 capitalize">{cat}</span>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 rounded-full bg-brand-600"
                    style={{ width: `${Math.min((count / services.length) * 100, 100) * 1.2}px` }}
                  />
                  <span className="text-xs font-mono text-white w-4 text-right">{count}</span>
                </div>
              </div>
            ))}
            {Object.keys(categories).length === 0 && (
              <p className="text-gray-600 text-sm">Nicio categorie disponibilă</p>
            )}
          </div>
        </div>

        <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">🏆 Top Provideri</h2>
          <div className="flex flex-col gap-2">
            {leaders.slice(0, 5).map((l, i) => (
              <div key={l.agentAddress} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-4">#{i+1}</span>
                  <span className="text-xs font-mono text-gray-400">
                    {l.agentAddress.slice(0, 10)}...{l.agentAddress.slice(-4)}
                  </span>
                </div>
                <span className="text-xs font-bold text-yellow-400">{l.compositeScore}</span>
              </div>
            ))}
            {leaders.length === 0 && <p className="text-gray-600 text-sm">Niciun provider</p>}
          </div>
        </div>
      </div>

      {/* Network */}
      <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">🌐 Network Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Backend</p>
            <p className={`text-sm font-semibold ${health?.status === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
              {health?.status === 'ok' ? '✅ Online' : '❌ Offline'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">MultiversX</p>
            <p className={`text-sm font-semibold ${health?.multiversxReachable ? 'text-green-400' : 'text-yellow-400'}`}>
              {health?.multiversxReachable ? '✅ Reachable' : '⚠️ Unreachable'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Contracts</p>
            <p className={`text-sm font-semibold ${health?.contractsConfigured ? 'text-green-400' : 'text-yellow-400'}`}>
              {health?.contractsConfigured ? '✅ Configured' : '⚠️ Not deployed'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Network</p>
            <p className="text-sm font-semibold text-emerald-400">{health?.network ?? 'devnet'}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
