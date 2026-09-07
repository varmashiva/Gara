import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCart, addCartItem, updateCartItem, removeCartItem } from './api';

const CART_KEY = ['cart'];

export function useCart() {
  return useQuery({ queryKey: CART_KEY, queryFn: fetchCart });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addCartItem,
    onSuccess: (data) => queryClient.setQueryData(CART_KEY, data),
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) => updateCartItem(itemId, quantity),
    onSuccess: (data) => queryClient.setQueryData(CART_KEY, data),
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeCartItem,
    onSuccess: (data) => queryClient.setQueryData(CART_KEY, data),
  });
}
