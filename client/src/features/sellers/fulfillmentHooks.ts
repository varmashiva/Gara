import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMyFulfillments, updateFulfillmentStatus } from './fulfillmentApi';
import { FulfillmentStatus } from '@/types/fulfillment';

const KEY = ['seller', 'fulfillments'];

export function useMyFulfillments() {
  return useQuery({ queryKey: KEY, queryFn: fetchMyFulfillments });
}

export function useUpdateFulfillmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: FulfillmentStatus }) => updateFulfillmentStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
