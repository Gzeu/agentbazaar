'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { DASHBOARD_STATS, MOCK_SERVICES, MOCK_TASKS } from '@/lib/mock-data';
import { useWalletContext } from '@/context/WalletContext';

// ── Mini sparkline (SVG, no deps) ─────────────────────────────────────────────
function Sparkline({ data, color = '#14b8a6' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const W = 120, H = 36;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / (max - min || 1)) * H;
    return `${x},${y}`;
  }).join(' ');
  const fill = `${pts} ${W},${H} 0,${H}`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
      <polygon points={fill} fill={color} opacity="0.12" />
      <polyline points={pts} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Donut chart (SVG, no deps) ────────────────────────────────────────────────
function DonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const R = 56, r = 36, cx = 70, cy = 70;
  const total = data.reduce((s, d) => s + d.value, 0);
  let angle = -Math.PI / 2;
  const slices = data.map(d => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(angle);
    const y1 = cy + R * Math.sin(angle);
    angle += sweep;
    const x2 = cx + R * Math.cos(angle);
    const y2 = cy + R * Math.sin(angle);
    const xi1 = cx + r * Math.cos(angle - sweep);
    const yi1 = cy + r * Math.sin(angle - sweep);
    const xi2 = cx + r * Math.cos(angle);
    const yi2 = cy + r * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    return { ...d, path: `M${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} L${xi2},${yi2} A${r},${r} 0 ${large},0 ${xi1},${yi1} Z` };
  });
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity="0.9" />)}
      <circle cx={cx} cy={cy} r={r - 4} fill="#131720" />
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#e2e8f0" fontSize="14" fontWeight="bold">6</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#64748b" fontSize="9">categorii</text>
    </svg>
  );
}

// ── Bar chart (SVG, no deps) ──────────────────────────────────────────────────
function BarChart({ data, color = '#14b8a6' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const W = 280, H = 80;
  const barW = W / data.length - 4;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {data.map((v, i) => {
        const h = (v / max) * (H - 8);
        const x = i * (W / data.length) + 2;
        const y = H - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx="3" fill={color} opacity="0.25" />
            <rect x={x} y={y} width={barW} height="2" rx="1" fill={color} />
          </g>
        );
      })}
    </svg>
  );
}

// ── Counter animation ────────────────────────────────────────────────────────
function AnimatedNumber({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 40;
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(start));
    }, 30);
    return () => clearInterval(t);
  }, [target]);
  return <>{prefix}{val.toLocaleString()}{suffix}</>;
}

export default function DashboardPage() {
  const { connected, address, balance } = useWalletContext();
  const days = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">Dashboard</h1>
          <p className="text-dark-muted text-sm mt-0.5">AgentBazaar Analytics · MultiversX Supernova Devnet</p>
        </div>
        {connected && address && (
          <div className="flex items-center gap-2 px-3 py-2 bg-dark-surface2 border border-dark-border rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-brand-400">{address.slice(0,8)}...{address.slice(-6)}</span>
            <span className="text-xs font-mono text-dark-muted">{Number(balance).toFixed(2)} EGLD</span>
          </div>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {[
          { label: 'Servicii Active', value: DASHBOARD_STATS.totalServices, suffix: '', color: 'text-brand-400' },
          { label: 'Agenți Activi',   value: DASHBOARD_STATS.activeAgents,  suffix: '', color: 'text-indigo-400' },
          { label: 'Tasks Azi',       value: DASHBOARD_STATS.tasksToday,    suffix: '', color: 'text-purple-400' },
          { label: 'Latență Medie',   value: DASHBOARD_STATS.avgLatency,    suffix: 'ms', color: 'text-amber-400' },
          { label: 'Success Rate',    value: DASHBOARD_STATS.successRate * 10, suffix: '%', color: 'text-emerald-400' },
          { label: 'Volume Total',    value: 1245, suffix: ' EGLD', color: 'text-teal-400' },
        ].map(({ label, value, suffix, color }) => (
          <div key={label} className="stat-card">
            <p className={`text-xl font-bold font-mono ${color}`}>
              <AnimatedNumber target={value} suffix={suffix} />
            </p>
            <p className="text-xs text-dark-muted mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Weekly volume bar */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-heading">Volum Săptămânal</h3>
              <p className="text-xs text-dark-muted mt-0.5">Tasks executate / zi (ultimele 7 zile)</p>
            </div>
            <span className="badge bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">↑ +16%</span>
          </div>
          <BarChart data={DASHBOARD_STATS.weeklyVolume} color="#14b8a6" />
          <div className="flex justify-between mt-2">
            {days.map(d => <span key={d} className="text-xs text-dark-muted font-mono">{d}</span>)}
          </div>
          <div className="flex items-end justify-between mt-4 pt-4 border-t border-dark-border">
            {DASHBOARD_STATS.weeklyVolume.map((v, i) => (
              <div key={i} className="text-center">
                <p className="text-xs font-mono text-dark-text">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Donut category breakdown */}
        <div className="card">
          <h3 className="section-heading mb-1">Categorii</h3>
          <p className="text-xs text-dark-muted mb-4">Distribuție pe tip serviciu</p>
          <div className="flex items-center gap-4">
            <DonutChart data={DASHBOARD_STATS.categoryBreakdown} />
            <div className="space-y-2 flex-1">
              {DASHBOARD_STATS.categoryBreakdown.map(c => (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-xs text-dark-muted truncate flex-1">{c.name}</span>
                  <span className="text-xs font-mono text-dark-text">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sparklines row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Data Fetching', data: [420, 580, 620, 540, 700, 820, 910], color: '#14b8a6' },
          { label: 'Compute',       data: [120, 200, 180, 260, 340, 380, 420], color: '#6366f1' },
          { label: 'Orchestration', data: [40, 80, 100, 120, 180, 200, 280], color: '#f59e0b' },
          { label: 'Compliance',    data: [20, 40, 35, 60, 70, 90, 110], color: '#ef4444' },
        ].map(({ label, data, color }) => (
          <div key={label} className="card">
            <p className="text-xs text-dark-muted mb-2">{label}</p>
            <Sparkline data={data} color={color} />
            <p className="text-sm font-bold font-mono mt-2" style={{ color }}>
              <AnimatedNumber target={data[data.length - 1]} suffix=" tasks" />
            </p>
          </div>
        ))}
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top services */}
        <div className="card overflow-hidden p-0">
          <div className="px-5 py-4 border-b border-dark-border flex items-center justify-between">
            <h3 className="section-heading">Top Servicii</h3>
            <Link href="/" className="text-xs text-brand-400 hover:text-brand-300">Vezi toate →</Link>
          </div>
          <div className="divide-y divide-dark-border">
            {MOCK_SERVICES.slice(0, 5).map((s, i) => (
              <Link key={s.id} href={`/services/${s.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-dark-surface2/50 transition-colors group">
                <span className="text-sm font-bold text-dark-muted w-5">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-text group-hover:text-brand-400 transition-colors truncate">{s.name}</p>
                  <p className="text-xs text-dark-muted">{(s.totalTasks / 1000).toFixed(1)}K tasks · {s.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-dark-text">{s.priceAmount} EGLD</p>
                  <p className="text-xs font-mono text-emerald-400">{(s.reputationScore / 100).toFixed(1)}%</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent tasks */}
        <div className="card overflow-hidden p-0">
          <div className="px-5 py-4 border-b border-dark-border flex items-center justify-between">
            <h3 className="section-heading">Tasks Recente</h3>
            <Link href="/tasks" className="text-xs text-brand-400 hover:text-brand-300">Vezi toate →</Link>
          </div>
          <div className="divide-y divide-dark-border">
            {MOCK_TASKS.map(t => {
              const svc = MOCK_SERVICES.find(s => s.id === t.serviceId);
              const STATUS_DOT: Record<string, string> = {
                pending: 'bg-amber-400', running: 'bg-purple-400 animate-pulse',
                completed: 'bg-emerald-400', failed: 'bg-red-400',
              };
              return (
                <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-dark-surface2/50 transition-colors group">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[t.status] ?? 'bg-dark-border'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-text group-hover:text-brand-400 transition-colors truncate">{svc?.name ?? t.serviceId}</p>
                    <p className="text-xs text-dark-muted font-mono">{t.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-dark-text">{t.maxBudget} EGLD</p>
                    {t.latencyMs && <p className="text-xs font-mono text-emerald-400">{t.latencyMs}ms</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Protocol health */}
      <div className="card mt-4">
        <h3 className="section-heading mb-4">Protocol Stack Health</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { name: 'UCP', desc: 'Discovery', uptime: 99.98, latency: 12 },
            { name: 'ACP', desc: 'Checkout',  uptime: 99.95, latency: 28 },
            { name: 'AP2', desc: 'Mandate',   uptime: 100.0, latency: 8 },
            { name: 'x402', desc: 'Payment',  uptime: 99.97, latency: 45 },
            { name: 'MCP', desc: 'Execution', uptime: 99.91, latency: 67 },
          ].map(p => (
            <div key={p.name} className="bg-dark-surface2 rounded-xl p-3 text-center border border-dark-border">
              <p className="text-sm font-bold font-mono text-brand-400">{p.name}</p>
              <p className="text-xs text-dark-muted mt-0.5">{p.desc}</p>
              <p className="text-sm font-bold text-emerald-400 mt-2">{p.uptime}%</p>
              <p className="text-xs text-dark-muted">{p.latency}ms avg</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
