import Link from 'next/link';
import { Star, Zap, Clock, Shield, ExternalLink } from 'lucide-react';
import clsx from 'clsx';
import type { Service } from '@/lib/types';

const CATEGORY_COLORS: Record<string, string> = {
  'data-fetching': 'bg-blue-900/30 text-blue-300 border-blue-700/30',
  'compute-offload': 'bg-purple-900/30 text-purple-300 border-purple-700/30',
  'wallet-actions': 'bg-yellow-900/30 text-yellow-300 border-yellow-700/30',
  'compliance': 'bg-red-900/30 text-red-300 border-red-700/30',
  'enrichment': 'bg-green-900/30 text-green-300 border-green-700/30',
  'orchestration': 'bg-brand-900/30 text-brand-300 border-brand-700/30',
  'notifications': 'bg-orange-900/30 text-orange-300 border-orange-700/30',
};

function reputationLabel(score: number): { label: string; color: string } {
  const pct = score / 100;
  if (pct >= 90) return { label: 'Excellent', color: 'text-green-400' };
  if (pct >= 75) return { label: 'Good', color: 'text-brand-400' };
  if (pct >= 50) return { label: 'Average', color: 'text-yellow-400' };
  return { label: 'Low', color: 'text-red-400' };
}

export function ServiceCard({ service }: { service: Service }) {
  const rep = reputationLabel(service.reputationScore);
  const catClass = CATEGORY_COLORS[service.category] || CATEGORY_COLORS['data-fetching'];

  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-3 hover:border-brand-700/40 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className={clsx('text-xs px-2 py-0.5 rounded border font-mono', catClass)}>
            {service.category}
          </span>
          <h3 className="mt-2 font-semibold text-white text-sm leading-tight">{service.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5 font-mono truncate">
            {service.providerAddress.slice(0, 10)}...{service.providerAddress.slice(-6)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-brand-400 font-mono font-semibold text-sm">
            {service.priceAmount} {service.priceToken}
          </p>
          <p className="text-xs text-gray-500">{service.pricingModel.replace('_', '/')}</p>
        </div>
      </div>

      {/* Description */}
      {service.description && (
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{service.description}</p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className={clsx('flex items-center gap-1', rep.color)}>
          <Star size={11} />
          {rep.label} ({(service.reputationScore / 100).toFixed(0)}%)
        </span>
        <span className="flex items-center gap-1">
          <Clock size={11} />
          ~{service.maxLatencyMs}ms
        </span>
        <span className="flex items-center gap-1">
          <Zap size={11} className="text-green-400" />
          {service.totalTasks} tasks
        </span>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5">
        {service.ucpCompatible && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
            UCP
          </span>
        )}
        {service.mcpCompatible && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
            MCP
          </span>
        )}
        {service.tags?.slice(0, 2).map((t) => (
          <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-500">
            {t}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-2 border-t border-white/5">
        <Link
          href={`/services/${service.id}`}
          className="flex-1 text-center py-1.5 rounded-lg bg-brand-600/20 hover:bg-brand-600/40 text-brand-300 text-xs font-medium transition-colors"
        >
          View Details
        </Link>
        <button className="flex-1 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-colors">
          Buy Task
        </button>
      </div>
    </div>
  );
}
