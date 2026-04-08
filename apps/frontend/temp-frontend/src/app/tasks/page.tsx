'use client';

import { useState, useEffect } from 'react';
import { Zap, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'disputed';

interface Task {
  id: string;
  serviceId: string;
  consumerId: string;
  providerAddress: string;
  status: TaskStatus;
  maxBudget: string;
  latencyMs?: number;
  createdAt: string;
  deadline: string;
}

const STATUS_MOCK: Task[] = [
  { id: 'task-001', serviceId: 'svc-001', consumerId: 'erd1consumer…', providerAddress: 'erd1provider…', status: 'completed', maxBudget: '1000000000000000', latencyMs: 187, createdAt: new Date(Date.now()-3600000).toISOString(), deadline: new Date(Date.now()+300000).toISOString() },
  { id: 'task-002', serviceId: 'svc-002', consumerId: 'erd1consumer…', providerAddress: 'erd1provider…', status: 'running',   maxBudget: '5000000000000000', createdAt: new Date(Date.now()-120000).toISOString(),  deadline: new Date(Date.now()+180000).toISOString() },
  { id: 'task-003', serviceId: 'svc-003', consumerId: 'erd1consumer…', providerAddress: 'erd1provider…', status: 'pending',   maxBudget: '500000000000000',  createdAt: new Date(Date.now()-30000).toISOString(),   deadline: new Date(Date.now()+270000).toISOString() },
  { id: 'task-004', serviceId: 'svc-001', consumerId: 'erd1consumer…', providerAddress: 'erd1provider…', status: 'failed',    maxBudget: '1000000000000000', createdAt: new Date(Date.now()-7200000).toISOString(),  deadline: new Date(Date.now()-6900000).toISOString() },
  { id: 'task-005', serviceId: 'svc-004', consumerId: 'erd1consumer…', providerAddress: 'erd1provider…', status: 'disputed',  maxBudget: '3000000000000000', createdAt: new Date(Date.now()-86400000).toISOString(), deadline: new Date(Date.now()-86100000).toISOString() },
];

const STATUS_ICON: Record<TaskStatus, React.ReactNode> = {
  pending:   <Clock         size={14} className="text-yellow-400" />,
  running:   <Zap           size={14} className="text-blue-400 animate-pulse" />,
  completed: <CheckCircle   size={14} className="text-emerald-400" />,
  failed:    <XCircle       size={14} className="text-red-400" />,
  disputed:  <AlertTriangle size={14} className="text-orange-400" />,
};

const STATUS_COLOR: Record<TaskStatus, string> = {
  pending:   'bg-yellow-400/10  text-yellow-400  border-yellow-400/30',
  running:   'bg-blue-400/10    text-blue-400    border-blue-400/30',
  completed: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
  failed:    'bg-red-400/10     text-red-400     border-red-400/30',
  disputed:  'bg-orange-400/10  text-orange-400  border-orange-400/30',
};

export default function TasksPage() {
  const [tasks,   setTasks]   = useState<Task[]>([]);
  const [filter,  setFilter]  = useState<TaskStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND}/tasks?limit=50`);
        if (res.ok) {
          const data = await res.json() as { data?: Task[] } | Task[];
          setTasks(Array.isArray(data) ? data : (data.data ?? []));
        } else {
          setTasks(STATUS_MOCK);
        }
      } catch {
        setTasks(STATUS_MOCK);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const displayed = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const counts: Record<string, number> = { all: tasks.length };
  (['pending','running','completed','failed','disputed'] as TaskStatus[]).forEach(s => {
    counts[s] = tasks.filter(t => t.status === s).length;
  });

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Tasks</h1>
            <p className="text-sm text-gray-400 mt-1">On-chain task execution history</p>
          </div>
          <button onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 800); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 text-xs hover:text-white transition-colors">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Status filter pills */}
        <div className="flex gap-2 flex-wrap">
          {(['all','pending','running','completed','failed','disputed'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filter === s ? 'border-brand-500/50 bg-brand-500/20 text-brand-300' : 'border-white/10 text-gray-500 hover:text-gray-300'
              }`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="ml-1.5 opacity-60">{counts[s] ?? 0}</span>
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          Array.from({length:4}).map((_,i)=><div key={i} className="glass rounded-xl h-20 animate-pulse" />)
        ) : displayed.length === 0 ? (
          <div className="py-20 text-center text-gray-500">No tasks found.</div>
        ) : (
          <div className="space-y-3">
            {displayed.map(task => (
              <div key={task.id} className="glass rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {STATUS_ICON[task.status]}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-white truncate">{task.id}</span>
                      <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLOR[task.status]}`}>
                        {task.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Service: {task.serviceId} · Budget: {(Number(task.maxBudget) / 1e18).toFixed(4)} EGLD
                      {task.latencyMs ? ` · ${task.latencyMs}ms` : ''}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 shrink-0" suppressHydrationWarning>
                  {new Date(task.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
