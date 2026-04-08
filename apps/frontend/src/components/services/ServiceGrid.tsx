'use client';

import { useServices } from '@/hooks/useServices';
import { ServiceCard } from './ServiceCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Database } from 'lucide-react';

export function ServiceGrid({ filters }: { filters?: Record<string, unknown> }) {
  const { data, isLoading } = useServices(filters);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-52" />
        ))}
      </div>
    );
  }

  if (!data?.data?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center mb-4">
          <Database size={20} className="text-dark-muted" />
        </div>
        <h3 className="text-dark-text font-medium mb-1">No services yet</h3>
        <p className="text-dark-muted text-sm max-w-xs">
          Fii primul provider — înregistrează un serviciu și începe să câștigi EGLD.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.data.map((service) => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  );
}
