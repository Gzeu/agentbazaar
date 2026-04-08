import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useServices(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['services', filters],
    queryFn: () => api.get('/api/v1/services', { params: filters }).then((r) => r.data),
  });
}

export function useService(id: string) {
  return useQuery({
    queryKey: ['service', id],
    queryFn: () => api.get(`/api/v1/services/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useRegisterService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post('/api/v1/services/register', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}
