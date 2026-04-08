'use client';

import { useState, useEffect } from 'react';
import { DASHBOARD_STATS, MOCK_TASKS, MOCK_SERVICES } from '@/lib/mock-data';
import type { Task } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  completed: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  running: 'text-brand-400 bg-brand-400/10 border-brand-400/20',
  pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  failed: 'text-red-400 bg-red-400/10 border-red-400/20',
  disputed: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
};

const STATUS_DOTS: Record<string, string> = {
  completed: 'bg-emerald-400',
  running: 'bg-brand-400 animate-pulse',
  pending: 'bg-yellow-400',
  failed: 'bg-red-400',
  disputed: 'bg-orange-400',
};

function MiniBarChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((v, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div
            className={`w-full rounded-sm transition-all duration-500 ${
              i === data.length - 1 ? 'bg-brand-400' : 'bg-brand-500/40'
            }`}
            style={{ height: `${(v / max) * 100}%` }}
          />
          <span className="text-[10px] text-dark-muted">{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`stat-card flex flex-col gap-2 ${ accent ? 'border-brand-500/30 bg-brand-500/5' : '' }`}>
      <span className="text-xs text-dark-muted uppercase tracking-wider">{label}</span>
      <span className={`text-2xl font-bold font-mono ${ accent ? 'text-brand-400' : 'text-dark-text' }`}>{value}</span>
      {sub && <span className="text-xs text-dark-muted">{sub}</span>}
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const service = MOCK_SERVICES.find(s => s.id === task.serviceId);
  return (
    <div className="flex items-center gap-4 py-3 border-b border-dark-border/50 hover:bg-dark-surface2/50 px-2 rounded transition-colors">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOTS[task.status]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-dark-text truncate">{service?.name ?? task.serviceId}</p>
        <p className="text-xs text-dark-muted">{task.id}</p>
      </div>
      <span className={`badge border ${STATUS_COLORS[task.status]} text-xs`}>{task.status}</span>
      <span className="text-xs text-dark-muted font-mono w-16 text-right">
        {task.latencyMs ? `${task.latencyMs}ms` : '—'}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const stats = DASHBOARD_STATS;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-dark-text">Dashboard</h1>
          <span className="inline-flex items-center gap-1.5 text-xs text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Supernova Devnet
          </span>
        </div>
        <p className="text-dark-muted text-sm">Activitate agent-to-agent în timp real pe MultiversX</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Servicii Active" value={String(stats.totalServices)} sub="înregistrate" />
        <StatCard label="Agenți Live" value={String(stats.activeAgents)} sub="pe rețea" accent />
        <StatCard label="Volum Total" value={stats.totalVolume} sub="EGLD" />
        <StatCard label="Task-uri Azi" value={String(stats.tasksToday)} sub="+12% vs ieri" />
        <StatCard label="Success Rate" value={`${stats.successRate}%`} sub="ultimele 24h" />
        <StatCard label="Latență Med." value={`${stats.avgLatency}ms`} sub="avg execuție" />
      </div>

      {/* Charts + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Weekly Volume */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-heading">Volum săptămânal</h3>
            <span className="text-xs text-dark-muted">tasks/zi</span>
          </div>
          <MiniBarChart data={stats.weeklyVolume} />
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <h3 className="section-heading mb-4">Categorii</h3>
          <div className="space-y-3">
            {stats.categoryBreakdown.map(cat => (
              <div key={cat.name} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                <span className="text-sm text-dark-muted flex-1 truncate">{cat.name}</span>
                <span className="text-sm font-mono text-dark-text">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-heading">Task-uri recente</h3>
          <a href="/tasks" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">Vezi toate →</a>
        </div>
        <div className="divide-y divide-dark-border/30">
          {MOCK_TASKS.map(task => <TaskRow key={task.id} task={task} />)}
        </div>
      </div>

      {/* Live Feed */}
      <div className="card mt-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          <h3 className="section-heading">Protocoale active</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {['UCP', 'ACP', 'AP2', 'MCP', 'x402'].map(proto => (
            <div key={proto} className="bg-dark-surface2 border border-brand-500/20 rounded-lg p-3 text-center">
              <p className="text-sm font-bold font-mono text-brand-400">{proto}</p>
              <p className="text-xs text-dark-muted mt-1">Active</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
