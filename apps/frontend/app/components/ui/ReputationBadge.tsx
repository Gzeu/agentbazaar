'use client';
import { Star, Shield, TrendingUp } from 'lucide-react';

interface Props {
  score: number;
  onChain?: boolean;
  size?: 'sm' | 'md';
}

function tier(score: number) {
  if (score >= 90) return { label: 'Elite',    color: 'text-amber-400',   bg: 'bg-amber-400/10   border-amber-400/20' };
  if (score >= 70) return { label: 'Trusted',  color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' };
  if (score >= 40) return { label: 'Active',   color: 'text-brand-400',   bg: 'bg-brand-400/10   border-brand-400/20' };
  return              { label: 'New',      color: 'text-gray-400',    bg: 'bg-gray-400/10    border-gray-400/20' };
}

export function ReputationBadge({ score, onChain = false, size = 'sm' }: Props) {
  const t = tier(score);
  const isLg = size === 'md';

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${t.bg} ${t.color}`}>
      <Star size={isLg ? 12 : 10} fill="currentColor" />
      <span>{score}</span>
      {isLg && <span className="opacity-70">{t.label}</span>}
      {onChain && <Shield size={isLg ? 11 : 9} className="opacity-80" title="On-chain verified" />}
    </div>
  );
}
