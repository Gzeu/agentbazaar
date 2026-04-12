import Head from 'next/head';
import { useState } from 'react';
import { Activity, CheckCircle2, Clock, XCircle, AlertTriangle, Zap } from 'lucide-react';
import { useTasks, useTaskMetrics, TaskStatus } from '@/hooks/useTasks';
import { TaskFeed } from '@/components/tasks/TaskFeed';
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge';
import { SubmitTaskModal } from '@/components/tasks/SubmitTaskModal';
import { McpStatusBar } from '@/components/ui/McpStatusBar';

const STATUS_TABS: { value: TaskStatus | ''; label: string }[] = [
  { value: '',          label: 'All' },
  { value: 'running',   label: 'Running' },
  { value: 'pending',   label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed',    label: 'Failed' },
  { value: 'disputed',  label: 'Disputed' },
];

export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [showModal, setShowModal] = useState(false);
  const metrics = useTaskMetrics(8_000);
  const { tasks, refetch } = useTasks(
    statusFilter ? { status: statusFilter, limit: 50 } : { limit: 50 },
    6_000,
  );

  const kpis = metrics
    ? [
        { label: 'Total',     value: metrics.total,      icon: Activity,       color: 'text-brand-400' },
        { label: 'Completed', value: metrics.completed,  icon: CheckCircle2,   color: 'text-emerald-400' },
        { label: 'Running',   value: metrics.running,    icon: Clock,          color: 'text-blue-400' },
        { label: 'Failed',    value: metrics.failed,     icon: XCircle,        color: 'text-red-400' },
        { label: 'Success %', value: `${metrics.successRate}%`, icon: Activity, color: 'text-amber-400' },
        { label: 'Avg ms',    value: metrics.avgLatencyMs,       icon: Clock,   color: 'text-purple-400' },
      ]
    : [];

  return (
    <>
      <Head><title>Tasks — AgentBazaar</title></Head>

      {showModal && (
        <SubmitTaskModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); refetch(); }}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Task Monitor</h1>
            <p className="text-sm text-gray-500 mt-0.5">Live autonomous execution feed — polling every 6s</p>
          </div>
          <div className="flex items-center gap-3">
            <McpStatusBar />
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
            >
              <Zap size={14} />New Task
            </button>
          </div>
        </div>

        {/* KPI row */}
        {kpis.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
            {kpis.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="glass rounded-xl p-3 text-center">
                <Icon size={14} className={`mx-auto ${color} mb-1`} />
                <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
                <p className="text-xs text-gray-600">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Status filter tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {STATUS_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setStatusFilter(t.value as TaskStatus | '')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === t.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/8'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Feed */}
        <TaskFeed limit={50} />
      </div>
    </>
  );
}
