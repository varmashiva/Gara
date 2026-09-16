import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

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

export function useCreateAdminProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.NewAdminProduct) => api.createAdminProduct(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
}

export function useUploadAdminProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => api.uploadAdminProductImage(id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
}

export function useDeleteAdminProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, publicId }: { id: string; publicId: string }) => api.deleteAdminProductImage(id, publicId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
}

export function useUpdateAdminProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, edits }: { id: string; edits: api.AdminProductEdits }) => api.updateAdminProduct(id, edits),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
}

export function useDeleteAdminProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteAdminProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
}

export function useAdminHeroBanner() {
  return useQuery({ queryKey: ['admin', 'hero'], queryFn: api.fetchAdminHeroBanner });
}

export function useUpdateHeroBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.HeroBannerEdits) => api.updateHeroBanner(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'hero'] });
      queryClient.invalidateQueries({ queryKey: ['hero'] });
    },
  });
}

export function useUploadHeroBannerImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => api.uploadHeroBannerImage(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'hero'] });
      queryClient.invalidateQueries({ queryKey: ['hero'] });
    },
  });
}

export function useRemoveHeroBannerImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.removeHeroBannerImage(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'hero'] });
      queryClient.invalidateQueries({ queryKey: ['hero'] });
    },
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

export function useAdminOrderSummary() {
  return useQuery({ queryKey: ['admin', 'orders', 'summary'], queryFn: api.fetchAdminOrderSummary });
}

export function useAdminOrders(status?: string) {
  return useQuery({ queryKey: ['admin', 'orders', status], queryFn: () => api.fetchAdminOrders(status) });
}

export function useAdminOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'order', id],
    queryFn: () => api.fetchAdminOrder(id!),
    enabled: !!id,
  });
}
