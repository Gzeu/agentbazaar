'use client';

import Link from 'next/link';
import { clsx } from 'clsx';
import { Star, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import type { ServiceRecord } from '@/types/service';

const CATEGORY_COLORS: Record<string, string> = {
  'data-fetching':   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'compute-offload': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'wallet-actions':  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'compliance':      'bg-red-500/10 text-red-400 border-red-500/20',
  'enrichment':      'bg-green-500/10 text-green-400 border-green-500/20',
  'orchestration':   'bg-brand-500/10 text-brand-400 border-brand-500/20',
  'notifications':   'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

export function ServiceCard({ service }: { service: ServiceRecord }) {
  const scorePercent = (service.reputationScore / 100).toFixed(0);
  const categoryColor = CATEGORY_COLORS[service.category] || 'bg-dark-surface2 text-dark-muted border-dark-border';

  return (
    <Link href={`/services/${service.id}`} className="card block group animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <span className={clsx('badge border text-xs', categoryColor)}>
          {service.category}
        </span>
        <div className="flex items-center gap-1 text-xs text-dark-muted">
          <Star size={11} className="text-yellow-400 fill-yellow-400" />
          <span className="font-mono">{scorePercent}%</span>
        </div>
      </div>

      <h3 className="font-semibold text-dark-text group-hover:text-brand-400 transition-colors mb-1.5 leading-snug">
        {service.name}
      </h3>
      <p className="text-dark-muted text-xs leading-relaxed line-clamp-2 mb-4">
        {service.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {service.mcpCompatible && (
          <span className="badge bg-dark-surface2 border border-dark-border text-dark-muted">MCP</span>
        )}
        {service.ucpCompatible && (
          <span className="badge bg-dark-surface2 border border-dark-border text-dark-muted">UCP</span>
        )}
        <span className="flex items-center gap-1 badge bg-dark-surface2 border border-dark-border text-dark-muted">
          <Zap size={10} className="text-brand-400" />
          {service.maxLatencyMs}ms
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-dark-border">
        <div>
          <span className="text-brand-400 font-semibold text-sm font-mono">{service.priceAmount} {service.priceToken}</span>
          <span className="text-dark-muted text-xs ml-1">/ {service.pricingModel.replace('_', ' ')}</span>
        </div>
        <ArrowRight size={14} className="text-dark-muted group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}
