'use client';

const STATS = [
  { label: 'Services Listed', value: '—' },
  { label: 'Tasks Executed', value: '—' },
  { label: 'Avg Latency', value: '< 1s' },
  { label: 'Network', value: 'Supernova' },
];

export function StatsBar() {
  return (
    <div className="border-y border-dark-border bg-dark-surface/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-lg font-bold text-brand-400 font-mono">{value}</div>
              <div className="text-xs text-dark-muted mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
