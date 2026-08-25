"use client";

import { useAnalytics } from "@/hooks/useAnalytics";

export default function AnalyticsPage() {
  const { dashboard, categories, volume, loading, error, refresh } = useAnalytics(7);

  const maxVol = Math.max(...volume.map((v) => v.volumeEgld), 0.000001);
  const categoryEntries = Object.entries(categories?.categories ?? {})
    .sort((a, b) => b[1].tasks - a[1].tasks);
  const maxCatTasks = Math.max(...categoryEntries.map(([, v]) => v.tasks), 1);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Analytics</h1>
            <p className="text-xs mt-1 font-mono" style={{ color: "var(--color-text-muted)" }}>
              {dashboard ? `snapshot ${new Date(dashboard.timestamp).toLocaleTimeString()}` : "loading…"}
            </p>
          </div>
          <button className="btn-ghost text-xs" onClick={() => void refresh()}>↻ Refresh</button>
        </div>

        {error && (
          <div className="card text-sm" style={{ color: "var(--color-danger)" }}>⚠ {error}</div>
        )}

        {loading && !dashboard && (
          <div className="card text-center text-sm" style={{ color: "var(--color-text-muted)" }}>Loading dashboard…</div>
        )}

        {dashboard && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Tasks",   value: String(dashboard.tasks.total) },
                { label: "Completion Rate", value: `${Math.round(dashboard.tasks.completionRate * 100)}%` },
                { label: "Avg Latency",   value: `${Math.round(dashboard.tasks.avgLatencyMs)}ms` },
                { label: "TVL (locked)",  value: `${Number(dashboard.tvl.egld).toFixed(4)} EGLD` },
              ].map((s) => (
                <div key={s.label} className="card text-center space-y-1">
                  <div className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>{s.value}</div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Task status breakdown */}
            <div className="card space-y-3">
              <h2 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Task Status</h2>
              <div className="flex flex-wrap gap-4 text-xs">
                {([
                  ["completed", dashboard.tasks.completed, "badge-success"],
                  ["running",   dashboard.tasks.running,   "badge-warning"],
                  ["pending",   dashboard.tasks.pending,   "badge-warning"],
                  ["disputed",  dashboard.tasks.disputed,  "badge-danger"],
                  ["failed",    dashboard.tasks.failed,    "badge-danger"],
                ] as const).map(([label, count, cls]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`badge ${cls}`}>{count}</span>
                    <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily volume — CSS bar chart */}
            <div className="card space-y-3">
              <h2 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Daily Volume (7d, EGLD)</h2>
              <div className="flex items-end gap-2 h-40">
                {volume.map((v) => (
                  <div key={v.date} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--color-text)" }}>
                      {v.volumeEgld.toFixed(4)}
                    </span>
                    <div
                      className="w-full rounded-t"
                      style={{
                        height: `${Math.max((v.volumeEgld / maxVol) * 100, 2)}%`,
                        background: "var(--color-primary)",
                        opacity: 0.35 + 0.65 * (v.volumeEgld / maxVol),
                      }}
                      title={`${v.date}: ${v.tasks} tasks, ${v.completed} completed`}
                    />
                    <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{v.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="card space-y-3">
              <h2 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>By Category</h2>
              {categoryEntries.length === 0 && (
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>No services registered yet.</p>
              )}
              {categoryEntries.map(([cat, v]) => (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--color-text)" }}>{cat}</span>
                    <span style={{ color: "var(--color-text-muted)" }}>{v.services} services · {v.tasks} tasks</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(v.tasks / maxCatTasks) * 100}%`, background: "var(--color-primary)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
