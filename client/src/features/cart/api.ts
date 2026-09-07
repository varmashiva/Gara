import { api } from '@/api/axios';
import { Cart } from '@/types/cart';

type CartResponse = { success: true; data: Cart };

export async function fetchCart() {
  const res = await api.get<CartResponse>('/cart');
  return res.data.data;
}

export async function addCartItem(payload: { productId: string; variantId?: string; quantity: number }) {
  const res = await api.post<CartResponse>('/cart/items', payload);
  return res.data.data;
}

export async function updateCartItem(itemId: string, quantity: number) {
  const res = await api.patch<CartResponse>(`/cart/items/${itemId}`, { quantity });
  return res.data.data;
}

export async function removeCartItem(itemId: string) {
  const res = await api.delete<CartResponse>(`/cart/items/${itemId}`);
  return res.data.data;
}
