'use client';

import { useState } from 'react';
import { ArrowLeft, Zap, Star, Shield, CheckCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { ServiceRecord } from '@/types/service';
import { SubmitTaskModal } from '@/components/tasks/SubmitTaskModal';

export function ServiceDetail({ service }: { service: ServiceRecord }) {
  const [showTask, setShowTask] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <Link href="/services" className="btn-ghost text-sm mb-6 inline-flex">
        <ArrowLeft size={14} />
        Back to Services
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-dark-text mb-1">{service.name}</h1>
                <p className="text-dark-muted text-sm">{service.description}</p>
              </div>
              <span className="badge bg-brand-500/10 text-brand-400 border border-brand-500/20">
                {service.category}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-dark-muted">
              <span className="flex items-center gap-1"><Zap size={11} className="text-brand-400" />{service.maxLatencyMs}ms max latency</span>
              <span className="flex items-center gap-1"><Star size={11} className="text-yellow-400" />{(service.reputationScore/100).toFixed(0)}% reputation</span>
              <span className="flex items-center gap-1"><Shield size={11} className="text-green-400" />{service.stakeAmount} staked</span>
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-dark-text mb-3 text-sm uppercase tracking-wider">Input Schema</h2>
            <pre className="font-mono text-xs text-brand-300 bg-dark-bg rounded-lg p-4 overflow-auto">
              {JSON.stringify(service.inputSchema, null, 2)}
            </pre>
          </div>

          <div className="card">
            <h2 className="font-semibold text-dark-text mb-3 text-sm uppercase tracking-wider">Output Schema</h2>
            <pre className="font-mono text-xs text-brand-300 bg-dark-bg rounded-lg p-4 overflow-auto">
              {JSON.stringify(service.outputSchema, null, 2)}
            </pre>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card">
            <div className="mb-4">
              <div className="text-2xl font-bold text-brand-400 font-mono">{service.priceAmount} {service.priceToken}</div>
              <div className="text-dark-muted text-xs mt-0.5">per {service.pricingModel.replace('_', ' ')}</div>
            </div>
            <button className="btn-primary w-full" onClick={() => setShowTask(true)}>
              <Zap size={14} />
              Submit Task
            </button>
          </div>

          <div className="card space-y-3">
            <h3 className="text-sm font-medium text-dark-text">Compatibility</h3>
            {[
              { label: 'UCP Compatible', ok: service.ucpCompatible },
              { label: 'MCP Compatible', ok: service.mcpCompatible },
              { label: 'Active', ok: service.active },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-dark-muted">{label}</span>
                <CheckCircle size={14} className={ok ? 'text-green-400' : 'text-dark-muted'} />
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-dark-text mb-3">Provider</h3>
            <p className="text-xs text-dark-muted font-mono break-all">{service.providerAddress}</p>
          </div>
        </div>
      </div>

      {showTask && <SubmitTaskModal serviceId={service.id} providerAddress={service.providerAddress} onClose={() => setShowTask(false)} />}
    </div>
  );
}
