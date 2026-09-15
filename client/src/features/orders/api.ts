import { api } from '@/api/axios';
import { Address, Order } from '@/types/order';

export async function fetchAddresses() {
  const res = await api.get<{ success: true; data: Address[] }>('/addresses');
  return res.data.data;
}

export async function createAddress(payload: Omit<Address, '_id' | 'isDefault'> & { isDefault?: boolean }) {
  const res = await api.post<{ success: true; data: Address }>('/addresses', payload);
  return res.data.data;
}

export async function updateAddress(id: string, payload: Partial<Omit<Address, '_id'>>) {
  const res = await api.patch<{ success: true; data: Address }>(`/addresses/${id}`, payload);
  return res.data.data;
}

export async function createOrder(addressId: string, couponCode?: string) {
  const res = await api.post<{ success: true; data: Order }>('/orders', { addressId, couponCode });
  return res.data.data;
}

export async function fetchOrders() {
  const res = await api.get<{ success: true; data: Order[] }>('/orders');
  return res.data.data;
}

export async function fetchOrder(id: string) {
  const res = await api.get<{ success: true; data: Order }>(`/orders/${id}`);
  return res.data.data;
}

export type OrderTrackingFulfillment = {
  _id: string;
  sellerId: string;
  status: string;
  items: { productName: string; quantity: number }[];
};

export async function fetchOrderTracking(id: string) {
  const res = await api.get<{ success: true; data: { order: Order; fulfillments: OrderTrackingFulfillment[] } }>(
    `/orders/${id}/tracking`
  );
  return res.data.data;
}

export async function createPaymentOrder(orderId: string) {
  const res = await api.post<{ success: true; data: { providerOrderId: string; amount: number; provider: string } }>(
    '/payments/create-order',
    { orderId }
  );
  return res.data.data;
}

export async function simulatePaymentComplete(providerOrderId: string, status: 'captured' | 'failed' = 'captured') {
  const res = await api.post(`/payments/mock/${providerOrderId}/complete`, { status });
  return res.data.data;
}
