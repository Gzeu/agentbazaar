import useSWR from 'swr';
import { tasksApi } from '@/lib/api';
import type { Task } from '@/lib/types';

export function useTask(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `task-${id}` : null,
    () => tasksApi.get(id),
    { refreshInterval: 3000 }, // Poll every 3s for live status
  );
  return { task: data as Task | undefined, loading: isLoading, error, refresh: mutate };
}

export function useTasksByConsumer(address: string) {
  const { data, error, isLoading } = useSWR(
    address ? `tasks-consumer-${address}` : null,
    () => tasksApi.byConsumer(address),
    { refreshInterval: 5000 },
  );
  return { tasks: (data || []) as Task[], loading: isLoading, error };
}
