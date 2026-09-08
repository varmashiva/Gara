import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

export function useApplications(status?: string) {
  return useQuery({ queryKey: ['admin', 'applications', status], queryFn: () => api.fetchApplications(status) });
}

export function useDecideApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'APPROVED' | 'REJECTED' }) => api.decideApplication(id, decision),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'applications'] }),
  });
}

export function useAdminProducts(status?: string) {
  return useQuery({ queryKey: ['admin', 'products', status], queryFn: () => api.fetchAdminProducts(status) });
}

export function useDecideProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'APPROVED' | 'REJECTED' }) => api.decideProduct(id, decision),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
}

export function useAdminReturns() {
  return useQuery({ queryKey: ['admin', 'returns'], queryFn: api.fetchAdminReturns });
}

export function useDecideReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'APPROVED' | 'REJECTED' }) => api.decideReturn(id, decision),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'returns'] }),
  });
}
