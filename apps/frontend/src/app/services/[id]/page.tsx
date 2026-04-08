'use client';

import { useParams } from 'next/navigation';
import { useService } from '@/hooks/useServices';
import { ServiceDetail } from '@/components/services/ServiceDetail';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: service, isLoading } = useService(id);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <p className="text-dark-muted">Service not found.</p>
      </div>
    );
  }

  return <ServiceDetail service={service} />;
}
