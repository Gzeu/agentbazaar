import Head from 'next/head';
import { Activity, Cpu, Globe, TrendingUp, Users, Zap } from 'lucide-react';
import { useHealth } from '@/hooks/useHealth';
import { useLeaderboard } from '@/hooks/useReputation';
import { useTaskMetrics } from '@/hooks/useTasks';
import { useServices } from '@/hooks/useServices';
import { ReputationBadge } from '@/components/ui/ReputationBadge';
import { McpStatusBar } from '@/components/ui/McpStatusBar';

function shortAddr(a: string) {
  return a.length > 16 ? `${a.slice(0, 8)}…${a.slice(-6)}` : a;
}

export default function DashboardPage() {
  const { data: health } = useHealth(15_000);
  const metrics          = useTaskMetrics(10_000);
  const { data: leaders } = useLeaderboard(8);
  const { total: svcTotal } = useServices();

  const systemCards = health
    ? [
        {
          label: 'SC MCP Status',
          value: health.mcp.connected ? `${health.mcp.toolsLoaded} tools` : 'Offline',
          sub:   health.mcp.connected ? 'ABI-grounded' : 'SDK fallback',
          icon:  Cpu,
          color: health.mcp.connected ? 'text-emerald-400' : 'text-yellow-500',
        },
        {
          label: 'MultiversX',
          value: health.multiversx.reachable ? 'Reachable' : 'Unreachable',
          sub:   health.network,
          icon:  Globe,
          color: health.multiversx.reachable ? 'text-emerald-400' : 'text-red-400',
        },
        {
          label: 'Backend',
          value: `v${health.version}`,
          sub:   `${Math.round(health.uptime / 60)}m uptime`,
          icon:  Activity,
          color: 'text-brand-400',
        },
        {
          label: 'Services',
          value: String(svcTotal),
          sub:   'on marketplace',
          icon:  Globe,
          color: 'text-purple-400',
        },
      ]
    : [];

  return (
    <>
      <Head><title>Dashboard — AgentBazaar</title></Head>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">System health · Task metrics · Reputation leaderboard</p>
          </div>
          <McpStatusBar />
        </div>

        {/* System status */}
        {systemCards.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">System</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {systemCards.map(({ label, value, sub, icon: Icon, color }) => (
                <div key={label} className="glass rounded-xl p-4">
                  <Icon size={16} className={`${color} mb-2`} />
                  <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  <p className="text-xs text-gray-700">{sub}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Task metrics */}
        {metrics && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Task Metrics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="glass rounded-xl p-4">
                <Zap size={16} className="text-brand-400 mb-2" />
                <p className="text-lg font-bold font-mono text-brand-400">{metrics.total}</p>
                <p className="text-xs text-gray-500">Total Tasks</p>
              </div>
              <div className="glass rounded-xl p-4">
                <TrendingUp size={16} className="text-emerald-400 mb-2" />
                <p className="text-lg font-bold font-mono text-emerald-400">{metrics.successRate}%</p>
                <p className="text-xs text-gray-500">Success Rate</p>
              </div>
              <div className="glass rounded-xl p-4">
                <Activity size={16} className="text-amber-400 mb-2" />
                <p className="text-lg font-bold font-mono text-amber-400">{metrics.avgLatencyMs}ms</p>
                <p className="text-xs text-gray-500">Avg Latency</p>
              </div>
              <div className="glass rounded-xl p-4">
                <Activity size={16} className="text-blue-400 mb-2" />
                <p className="text-lg font-bold font-mono text-blue-400">{metrics.onChainVerifiedRate}%</p>
                <p className="text-xs text-gray-500">On-Chain Verified</p>
              </div>
              <div className="glass rounded-xl p-4">
                <Activity size={16} className="text-red-400 mb-2" />
                <p className="text-lg font-bold font-mono text-red-400">{metrics.failed}</p>
                <p className="text-xs text-gray-500">Failed</p>
              </div>
              <div className="glass rounded-xl p-4">
                <Activity size={16} className="text-yellow-400 mb-2" />
                <p className="text-lg font-bold font-mono text-yellow-400">{metrics.disputed}</p>
                <p className="text-xs text-gray-500">Disputed</p>
              </div>
            </div>
          </section>
        )}

        {/* Reputation leaderboard */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Reputation Leaderboard</h2>
          {leaders.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center text-gray-600 text-sm">
              No reputation data yet. Complete tasks to build reputation.
            </div>
          ) : (
            <div className="glass rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-3 text-xs text-gray-600 font-medium">#</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-600 font-medium">Agent</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-600 font-medium">Score</th>
                    <th className="text-right px-4 py-3 text-xs text-gray-600 font-medium">Tasks</th>
                    <th className="text-right px-4 py-3 text-xs text-gray-600 font-medium">Success</th>
                    <th className="text-right px-4 py-3 text-xs text-gray-600 font-medium">Avg ms</th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.map((entry, idx) => (
                    <tr key={entry.address} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-white">{shortAddr(entry.address)}</td>
                      <td className="px-4 py-3">
                        <ReputationBadge score={entry.score} onChain={entry.onChain} size="md" />
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 font-mono text-xs">{entry.totalTasks}</td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-mono text-xs">{entry.successRate}%</td>
                      <td className="px-4 py-3 text-right text-gray-500 font-mono text-xs">{entry.avgLatencyMs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
