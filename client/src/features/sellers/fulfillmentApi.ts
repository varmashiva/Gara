import { api } from '@/api/axios';
import { Fulfillment, FulfillmentStatus } from '@/types/fulfillment';

export async function fetchMyFulfillments() {
  const res = await api.get<{ success: true; data: Fulfillment[] }>('/seller/fulfillments');
  return res.data.data;
}

export async function updateFulfillmentStatus(id: string, status: FulfillmentStatus) {
  const res = await api.patch<{ success: true; data: Fulfillment }>(`/seller/fulfillments/${id}/status`, { status });
  return res.data.data;
}
