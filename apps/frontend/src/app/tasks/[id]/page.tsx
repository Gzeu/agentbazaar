'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MOCK_TASKS, MOCK_SERVICES } from '@/lib/mock-data';

const STATUS_STEPS = ['pending', 'quoted', 'paid', 'running', 'completed'] as const;
type TaskStatus = 'pending' | 'quoted' | 'paid' | 'running' | 'completed' | 'failed';

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  quoted: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  paid: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
  running: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  failed: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const PROTOCOL_STEPS = [
  { key: 'ucp', label: 'UCP Discovery', desc: 'Service discovered via Universal Commerce Protocol' },
  { key: 'quote', label: 'ACP Quote', desc: 'Price negotiated and quote confirmed' },
  { key: 'mandate', label: 'AP2 Mandate', desc: 'Consumer agent mandate verified on-chain' },
  { key: 'payment', label: 'x402 Payment', desc: 'Settlement executed, escrow locked' },
  { key: 'execution', label: 'MCP Execution', desc: 'Service handler invoked via MCP protocol' },
  { key: 'proof', label: 'Proof & Result', desc: 'Execution proof anchored on Supernova' },
];

function ProtocolTimeline({ status }: { status: TaskStatus }) {
  const completedUpTo = status === 'failed' ? 3
    : status === 'pending' ? 0
    : status === 'quoted' ? 1
    : status === 'paid' ? 3
    : status === 'running' ? 4
    : 6;

  return (
    <div className="space-y-2">
      {PROTOCOL_STEPS.map((step, i) => {
        const done = i < completedUpTo;
        const active = i === completedUpTo;
        const failed = status === 'failed' && i === completedUpTo;
        return (
          <div key={step.key} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
            done ? 'bg-emerald-500/5 border-emerald-500/15'
            : active ? 'bg-brand-500/5 border-brand-500/20'
            : 'bg-dark-surface2 border-dark-border opacity-50'
          }`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border ${
              done ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
              : active && !failed ? 'bg-brand-500/20 border-brand-500/30 text-brand-400'
              : failed ? 'bg-red-500/20 border-red-500/30 text-red-400'
              : 'bg-dark-border border-dark-border text-dark-muted'
            }`}>
              {done ? '✓' : failed ? '✗' : active ? <span className="animate-pulse">●</span> : i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-semibold ${
                  done ? 'text-emerald-400' : active ? 'text-brand-400' : 'text-dark-muted'
                }`}>{step.label}</p>
                {done && <span className="text-xs text-dark-muted font-mono">✓ ok</span>}
                {active && !failed && <span className="text-xs text-brand-400 font-mono animate-pulse">in progress...</span>}
              </div>
              <p className="text-xs text-dark-muted mt-0.5">{step.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const task = MOCK_TASKS.find(t => t.id === id);
  const service = task ? MOCK_SERVICES.find(s => s.id === task.serviceId) : null;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!task || task.status !== 'running') return;
    const interval = setInterval(() => setElapsed(e => e + 100), 100);
    return () => clearInterval(interval);
  }, [task]);

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="text-5xl">🔍</span>
        <h2 className="text-lg font-bold text-dark-text">Task negăsit</h2>
        <button className="btn-secondary" onClick={() => router.push('/tasks')}>← Tasks</button>
      </div>
    );
  }

  const status = task.status as TaskStatus;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <button className="btn-ghost mb-6 -ml-2" onClick={() => router.push('/tasks')}>← Tasks</button>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`badge border ${STATUS_COLORS[status]}`}>{status}</span>
              <span className="text-xs font-mono text-dark-muted">{task.id}</span>
            </div>
            <h1 className="text-xl font-bold text-dark-text">{service?.name ?? 'Unknown Service'}</h1>
            <p className="text-xs text-dark-muted mt-1">
              Creat: {new Date(task.createdAt).toLocaleString('ro-RO')}
            </p>
          </div>
          {status === 'running' && (
            <div className="text-center">
              <p className="text-2xl font-mono font-bold text-brand-400">{elapsed}ms</p>
              <p className="text-xs text-dark-muted">elapsed</p>
            </div>
          )}
          {status === 'completed' && task.latencyMs && (
            <div className="text-center">
              <p className="text-2xl font-mono font-bold text-emerald-400">{task.latencyMs}ms</p>
              <p className="text-xs text-dark-muted">latență finală</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-dark-surface2 rounded-xl p-4">
          <p className="text-xs text-dark-muted uppercase tracking-wider mb-2">Budget Max</p>
          <p className="text-base font-bold font-mono text-dark-text">{task.maxBudget} EGLD</p>
        </div>
        <div className="bg-dark-surface2 rounded-xl p-4">
          <p className="text-xs text-dark-muted uppercase tracking-wider mb-2">Deadline</p>
          <p className="text-base font-bold font-mono text-dark-text">{new Date(task.deadline).toLocaleTimeString('ro-RO')}</p>
        </div>
        <div className="bg-dark-surface2 rounded-xl p-4">
          <p className="text-xs text-dark-muted uppercase tracking-wider mb-2">Proof Hash</p>
          <p className="text-xs font-mono text-brand-400 truncate">{task.proofHash ?? '—'}</p>
        </div>
      </div>

      {/* Protocol Timeline */}
      <div className="card mb-6">
        <h3 className="section-heading mb-4">Protocol Execution Flow</h3>
        <ProtocolTimeline status={status} />
      </div>

      {/* Payload */}
      <div className="card mb-6">
        <h3 className="section-heading mb-3">Payload</h3>
        <pre className="text-xs font-mono text-brand-300 bg-dark-surface2 rounded-lg p-4 overflow-x-auto">
          {JSON.stringify(task.payload, null, 2)}
        </pre>
      </div>

      {/* Result */}
      {task.result && (
        <div className="card border-emerald-500/20">
          <h3 className="section-heading mb-3 text-emerald-400">✓ Rezultat</h3>
          <pre className="text-xs font-mono text-emerald-300 bg-emerald-500/5 rounded-lg p-4 overflow-x-auto">
            {JSON.stringify(task.result, null, 2)}
          </pre>
        </div>
      )}

      {status === 'failed' && (
        <div className="card border-red-500/20">
          <h3 className="section-heading mb-2 text-red-400">✗ Task Eșuat</h3>
          <p className="text-sm text-dark-muted">Escrow-ul va fi returnat în 10 minute. Poți retrimite task-ul sau alege un alt provider.</p>
          <button className="btn-primary mt-4" onClick={() => router.push(`/services/${task.serviceId}`)}>↺ Reîncearcă</button>
        </div>
      )}
    </div>
  );
}
