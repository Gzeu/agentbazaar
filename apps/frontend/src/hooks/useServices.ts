import useSWR from 'swr';
import { servicesApi, discoveryApi } from '@/lib/api';
import type { Service } from '@/lib/types';

export function useServices(filters?: Record<string, unknown>) {
  const key = ['services', JSON.stringify(filters)];
  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => servicesApi.list(filters),
    { refreshInterval: 10000 },
  );

  return {
    services: (data?.data || []) as Service[],
    total: data?.total || 0,
    loading: isLoading,
    error,
    refresh: mutate,
  };
}

export function useService(id: string) {
  const { data, error, isLoading } = useSWR(
    id ? `service-${id}` : null,
    () => servicesApi.get(id),
  );
  return { service: data as Service | undefined, loading: isLoading, error };
}

export function useDiscover(params: Record<string, unknown>) {
  const { data, error, isLoading } = useSWR(
    ['discover', JSON.stringify(params)],
    () => discoveryApi.discover(params),
    { refreshInterval: 15000 },
  );
  return {
    services: (data?.services || []) as Service[],
    loading: isLoading,
    error,
  };
}
