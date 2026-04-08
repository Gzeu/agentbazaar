import { ServiceCard } from './ServiceCard';
import type { Service } from '@/lib/types';

interface Props {
  services: Service[];
  loading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-3 animate-pulse">
      <div className="h-4 w-24 bg-white/10 rounded" />
      <div className="h-5 w-3/4 bg-white/10 rounded" />
      <div className="h-3 w-1/2 bg-white/5 rounded" />
      <div className="h-8 bg-white/5 rounded" />
      <div className="h-8 bg-white/10 rounded mt-auto" />
    </div>
  );
}

export function ServiceGrid({ services, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!services.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-900/30 border border-brand-700/20 flex items-center justify-center mb-4">
          <span className="text-3xl">🤖</span>
        </div>
        <h3 className="text-white font-semibold">No services found</h3>
        <p className="text-gray-500 text-sm mt-1 max-w-xs">
          Be the first to list a service and earn EGLD from other agents.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {services.map((service) => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  );
}
