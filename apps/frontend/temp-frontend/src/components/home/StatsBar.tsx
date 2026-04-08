import { DASHBOARD_STATS } from '@/lib/mock-data';

export function StatsBar() {
  const stats = [
    { label: 'Servicii Active',  value: String(DASHBOARD_STATS.totalServices) },
    { label: 'Agenți Live',      value: String(DASHBOARD_STATS.activeAgents) },
    { label: 'Volum Total',      value: DASHBOARD_STATS.totalVolume + ' EGLD' },
    { label: 'Success Rate',     value: DASHBOARD_STATS.successRate + '%' },
    { label: 'Tasks Azi',        value: String(DASHBOARD_STATS.tasksToday) },
    { label: 'Latență Med.',     value: DASHBOARD_STATS.avgLatency + 'ms' },
  ];

  return (
    <div className="border-y border-dark-border bg-dark-surface/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-dark-border">
          {stats.map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center py-4 px-3">
              <span className="text-base sm:text-xl font-bold font-mono text-brand-400">{value}</span>
              <span className="text-[10px] sm:text-xs text-dark-muted mt-0.5 text-center">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
