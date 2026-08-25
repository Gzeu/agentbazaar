'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTasks }     from '@/hooks/useTasks';
import { useServices }  from '@/hooks/useServices';

// ── Sparkline ──────────────────────────────────────────────────────────────
function Sparkline({ data, color = '#14b8a6' }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data); const min = Math.min(...data);
  const w = 120; const h = 32;
  const pts = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w;
    const y = h - ((v - min) / (max - min + 1)) * h;
    return `${x},${y}`;
  }).join(' ');
  const area = `0,${h} ` + pts + ` ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sg)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle
        cx={(data.length - 1) / Math.max(data.length - 1, 1) * w}
        cy={h - ((data[data.length - 1] - min) / (max - min + 1)) * h}
        r="3" fill={color}
      />
    </svg>
  );
}

// ── Bar Chart ──────────────────────────────────────────────────────────────
function BarChart({ data, color = '#14b8a6' }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 280; const h = 80;
  const barW = w / data.length - 4;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {data.map((v, i) => {
        const bh = (v / max) * (h - 8);
        const x  = i * (w / data.length) + 2;
        const y  = h - bh;
        return (
          <rect key={i} x={x} y={y} width={barW} height={bh} rx="3"
            fill={i === data.length - 1 ? color : color + '66'} />
        );
      })}
    </svg>
  );
}

// ── Donut ──────────────────────────────────────────────────────────────────
function DonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = 54; const cx = 70; const cy = 70;
  let startAngle = -90;
  const slices = data.map(d => {
    const angle = (d.value / total) * 360;
    const start = startAngle;
    startAngle += angle;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(start));
    const y1 = cy + r * Math.sin(toRad(start));
    const x2 = cx + r * Math.cos(toRad(start + angle));
    const y2 = cy + r * Math.sin(toRad(start + angle));
    const large = angle > 180 ? 1 : 0;
    return { ...d, path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z` };
  });
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx={cx} cy={cy} r={r} fill="#1a2030" />
      {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity="0.85" />)}
      <circle cx={cx} cy={cy} r={r * 0.6} fill="#131720" />
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#e2e8f0" fontSize="18" fontWeight="bold" fontFamily="monospace">{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">tasks</text>
    </svg>
  );
}

// ── Protocol Health (static for now) ──────────────────────────────────────
function ProtocolHealth() {
  const protocols = [
    { name: 'UCP',  status: 'online',   latency: 12  },
    { name: 'ACP',  status: 'online',   latency: 8   },
    { name: 'AP2',  status: 'online',   latency: 15  },
    { name: 'x402', status: 'online',   latency: 6   },
    { name: 'MCP',  status: 'degraded', latency: 145 },
  ];
  return (
    <div className="card">
      <h3 className="section-heading mb-4">Protocol Health</h3>
      <div className="space-y-2">
        {protocols.map(p => (
          <div key={p.name} className="flex items-center justify-between py-2 border-b border-dark-border last:border-0">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                p.status === 'online' ? 'bg-emerald-400 animate-pulse-slow'
                : p.status === 'degraded' ? 'bg-amber-400 animate-pulse'
                : 'bg-red-400'
              }`} />
              <span className="text-sm font-mono text-dark-text">{p.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-mono ${
                p.latency < 50 ? 'text-emerald-400' : p.latency < 100 ? 'text-amber-400' : 'text-red-400'
              }`}>{p.latency}ms</span>
              <span className={`badge border text-xs ${
                p.status === 'online' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              }`}>{p.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── KPI Card ───────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, trend, color = 'text-dark-text', sparkData }: {
  label: string; value: string; sub?: string; trend?: string; color?: string; sparkData?: number[];
}) {
  return (
    <div className="stat-card flex flex-col gap-2">
      <p className="text-xs text-dark-muted uppercase tracking-wider">{label}</p>
      <div className="flex items-end justify-between">
        <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
        {sparkData && sparkData.length > 1 && (
          <Sparkline data={sparkData} color={color.includes('brand') || color.includes('teal') ? '#14b8a6' : '#10b981'} />
        )}
      </div>
      {sub   && <p className="text-xs text-dark-muted">{sub}</p>}
      {trend && <p className="text-xs text-emerald-400">↑ {trend}</p>}
    </div>
  );
}

// ── Live counter ───────────────────────────────────────────────────────────
function LiveCounter({ from, to, duration = 2000 }: { from: number; to: number; duration?: number }) {
  const [val, setVal] = useState(from);
  useEffect(() => {
    const steps = 40;
    const step  = (to - from) / steps;
    const delay = duration / steps;
    let current = from;
    const timer = setInterval(() => {
      current += step;
      if (current >= to) { setVal(to); clearInterval(timer); return; }
      setVal(Math.floor(current));
    }, delay);
    return () => clearInterval(timer);
  }, [from, to, duration]);
  return <>{val.toLocaleString()}</>;
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { dashboard, volume, categories, loading: analyticsLoading } = useAnalytics(7);
  const { tasks: recentTasks, stats }                                = useTasks();
  const { services: topServices }                                    = useServices();

  const t = dashboard.tasks;

  // Volume bar data from live endpoint, fallback to zeroes
  const weeklyBar = volume.length ? volume.map(v => v.tasks) : Array(7).fill(0);

  // Category donut from live endpoint
  const COLORS = ['#14b8a6','#a78bfa','#f59e0b','#10b981','#ef4444','#3b82f6','#f97316'];
  const catDonut = Object.entries(categories).map(([name, v], i) => ({
    name, value: (v as any).tasks ?? 0, color: COLORS[i % COLORS.length],
  }));

  const successRate = t.total > 0 ? ((t.completed / t.total) * 100).toFixed(1) : '0.0';

  const STATUS_COLORS: Record<string, string> = {
    pending: 'text-amber-400', running: 'text-purple-400',
    completed: 'text-emerald-400', failed: 'text-red-400',
    disputed: 'text-orange-400', refunded: 'text-blue-400',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">Dashboard</h1>
          <p className="text-dark-muted text-sm mt-0.5">AgentBazaar • MultiversX Supernova Devnet</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {analyticsLoading ? 'Loading...' : 'Live'}
        </div>
      </div>

      {/* KPI Row — from live useAnalytics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard label="Task-uri Total"   value={t.total.toLocaleString()}
          sub="all time" color="text-brand-400" sparkData={weeklyBar} />
        <KPICard label="Volume EGLD"      value={parseFloat(dashboard.tvl.egld).toFixed(4)}
          sub="TVL escrow" color="text-emerald-400" />
        <KPICard label="Rata Succes"      value={successRate + '%'}
          sub="completed / total" color="text-teal-400" />
        <KPICard label="Latență Medie"    value={t.avgLatencyMs + 'ms'}
          sub="p50 global" color="text-purple-400" />
      </div>

      {/* Live Stats from analytics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card text-center">
          <p className="text-xs text-dark-muted uppercase tracking-wider mb-1">Servicii Active</p>
          <p className="text-3xl font-bold font-mono text-brand-400">
            <LiveCounter from={0} to={dashboard.services.active} />
          </p>
        </div>
        <div className="stat-card text-center">
          <p className="text-xs text-dark-muted uppercase tracking-wider mb-1">Provideri</p>
          <p className="text-3xl font-bold font-mono text-emerald-400">
            <LiveCounter from={0} to={dashboard.reputation.totalProviders} duration={1500} />
          </p>
        </div>
        <div className="stat-card text-center">
          <p className="text-xs text-dark-muted uppercase tracking-wider mb-1">Block Time</p>
          <p className="text-3xl font-bold font-mono text-purple-400">~300ms</p>
        </div>
      </div>

      {/* Charts + Protocol Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-heading">Volume Săptămânal (Tasks)</h3>
            {weeklyBar.length > 1 && weeklyBar[0] > 0 && (
              <span className="text-xs text-emerald-400 font-mono">
                +{Math.round((weeklyBar[weeklyBar.length - 1] / Math.max(weeklyBar[0], 1) - 1) * 100)}% WoW
              </span>
            )}
          </div>
          <BarChart data={weeklyBar.length ? weeklyBar : [0, 0, 0, 0, 0, 0, 1]} />
          <div className="flex justify-between mt-2">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
              <span key={i} className="text-xs text-dark-muted flex-1 text-center">{d}</span>
            ))}
          </div>
        </div>

        <div className="card flex flex-col">
          <h3 className="section-heading mb-4">Categorii</h3>
          <div className="flex items-center gap-4">
            <DonutChart data={catDonut.length ? catDonut : [{ name: 'N/A', value: 1, color: '#334155' }]} />
            <div className="space-y-1.5">
              {catDonut.map(c => (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-xs text-dark-muted">{c.name}</span>
                  <span className="text-xs font-mono text-dark-text ml-auto">{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-heading">Task-uri Recente</h3>
            <Link href="/tasks" className="text-xs text-brand-400 hover:text-brand-300">Vezi toate →</Link>
          </div>
          <div className="space-y-2">
            {recentTasks.slice(0, 5).map(t => {
              const svc = topServices.find(s => s.id === t.serviceId);
              return (
                <Link key={t.id} href={`/tasks/${t.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-dark-surface2 hover:bg-dark-border transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      t.status === 'completed' ? 'bg-emerald-400'
                      : t.status === 'running'  ? 'bg-purple-400 animate-pulse'
                      : t.status === 'failed'   ? 'bg-red-400'
                      : t.status === 'disputed' ? 'bg-orange-400'
                      : t.status === 'refunded' ? 'bg-blue-400'
                      : 'bg-amber-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-dark-text group-hover:text-brand-400 transition-colors">
                        {svc?.name ?? t.serviceId}
                      </p>
                      <p className="text-xs text-dark-muted font-mono">{t.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-mono ${STATUS_COLORS[t.status] ?? 'text-dark-muted'}`}>{t.status}</p>
                    {t.latencyMs != null && <p className="text-xs text-dark-muted">{t.latencyMs}ms</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        <ProtocolHealth />
      </div>

      {/* Top Services */}
      <div className="card mt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-heading">Top Servicii</h3>
          <Link href="/" className="text-xs text-brand-400 hover:text-brand-300">Marketplace →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {topServices.slice(0, 3).map((s, i) => (
            <Link key={s.id} href={`/services/${s.id}`}
              className="bg-dark-surface2 rounded-xl p-4 hover:bg-dark-border transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-dark-muted">#{i + 1}</span>
                <span className="text-xs font-mono text-emerald-400">{(s.reputationScore / 100).toFixed(1)}%</span>
              </div>
              <p className="text-sm font-semibold text-dark-text group-hover:text-brand-400 transition-colors line-clamp-1">{s.name}</p>
              <p className="text-xs text-dark-muted mt-1">{(s.totalTasks / 1000).toFixed(1)}K tasks • {s.priceAmount} EGLD</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
