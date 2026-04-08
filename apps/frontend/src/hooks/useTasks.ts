import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useTasks(address?: string) {
  return useQuery({
    queryKey: ['tasks', address],
    queryFn: () =>
      address
        ? api.get(`/api/v1/tasks/consumer/${address}`).then((r) => r.data)
        : api.get('/api/v1/tasks').then((r) => r.data),
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => api.get(`/api/v1/tasks/${taskId}`).then((r) => r.data),
    enabled: !!taskId,
    refetchInterval: (data: any) => data?.status === 'running' || data?.status === 'pending' ? 2000 : false,
  });
}

export function useSubmitTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post('/api/v1/tasks', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
