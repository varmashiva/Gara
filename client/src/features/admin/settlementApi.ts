import { api } from '@/api/axios';

export type ApprovedSeller = { _id: string; storeName: string };
export type Settlement = {
  _id: string;
  sellerId: string;
  totalAmount: number;
  earningsCount: number;
  status: 'DRAFT' | 'FINALIZED' | 'PAID';
  createdAt: string;
};
export type Payout = {
  _id: string;
  settlementId: string;
  sellerId: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
};

export async function fetchApprovedSellers() {
  const res = await api.get<{ success: true; data: ApprovedSeller[] }>('/admin/sellers');
  return res.data.data;
}

export async function fetchSettlements() {
  const res = await api.get<{ success: true; data: Settlement[] }>('/admin/settlements');
  return res.data.data;
}

export async function createSettlement(sellerId: string) {
  const res = await api.post<{ success: true; data: Settlement }>('/admin/settlements', { sellerId });
  return res.data.data;
}

export async function finalizeSettlement(id: string) {
  const res = await api.post<{ success: true; data: Settlement }>(`/admin/settlements/${id}/finalize`);
  return res.data.data;
}

export async function createPayout(settlementId: string) {
  const res = await api.post<{ success: true; data: Payout }>(`/admin/settlements/${settlementId}/payout`);
  return res.data.data;
}

export async function fetchPayouts() {
  const res = await api.get<{ success: true; data: Payout[] }>('/admin/payouts');
  return res.data.data;
}

export async function markPayoutPaid(id: string) {
  const res = await api.patch<{ success: true; data: Payout }>(`/admin/payouts/${id}`, { status: 'PAID' });
  return res.data.data;
}
