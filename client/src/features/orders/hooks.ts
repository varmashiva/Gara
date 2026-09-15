import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

export function useAddresses() {
  return useQuery({ queryKey: ['addresses'], queryFn: api.fetchAddresses });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createAddress,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Parameters<typeof api.updateAddress>[1]) =>
      api.updateAddress(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });
}

export function useOrders() {
  return useQuery({ queryKey: ['orders'], queryFn: api.fetchOrders });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => api.fetchOrder(id!),
    enabled: !!id,
  });
}

export function useOrderTracking(id: string | undefined) {
  return useQuery({
    queryKey: ['order-tracking', id],
    queryFn: () => api.fetchOrderTracking(id!),
    enabled: !!id,
  });
}
