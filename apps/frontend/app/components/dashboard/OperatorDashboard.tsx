'use client';

import { BarChart2, Zap, Star, Shield, TrendingUp, Activity } from 'lucide-react';
import { useServices } from '@/hooks/useServices';
import { useTasks } from '@/hooks/useTasks';

export function OperatorDashboard() {
  const { data: services } = useServices({});
  const { data: tasks } = useTasks();

  const totalServices = services?.total || 0;
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((t) => t.status === 'completed').length || 0;
  const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(0) : '—';

  const STATS = [
    { icon: BarChart2, label: 'Total Services', value: totalServices, color: 'text-brand-400' },
    { icon: Zap, label: 'Total Tasks', value: totalTasks, color: 'text-purple-400' },
    { icon: TrendingUp, label: 'Completion Rate', value: `${completionRate}%`, color: 'text-green-400' },
    { icon: Activity, label: 'Avg Latency', value: '< 1s', color: 'text-yellow-400' },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="stat-card">
            <Icon size={18} className={`${color} mb-3`} />
            <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
            <div className="text-xs text-dark-muted mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent Tasks */}
      <div>
        <h2 className="section-heading mb-4">Recent Tasks</h2>
        {!tasks?.length ? (
          <div className="card text-center py-10 text-dark-muted text-sm">No tasks yet.</div>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 8).map((task) => (
              <div key={task.id} className="card flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-dark-text font-mono truncate">{task.id.slice(0, 20)}…</p>
                  <p className="text-xs text-dark-muted mt-0.5">{new Date(task.createdAt).toLocaleTimeString()}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-brand-400">{task.maxBudget} EGLD</span>
                  <span className={`badge border text-xs ${
                    task.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    task.status === 'running' ? 'bg-brand-500/10 text-brand-400 border-brand-500/20' :
                    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  }`}>{task.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
