import { api } from '@/api/axios';

export type SellerEarning = {
  _id: string;
  grossAmount: number;
  commissionAmount: number;
  refundDeduction: number;
  netPayable: number;
  status: string;
  createdAt: string;
};

export type EarningsSummary = {
  availableBalance: number;
  pendingSettlement: number;
  totalPaid: number;
};

export async function fetchMyEarnings() {
  const res = await api.get<{ success: true; data: SellerEarning[] }>('/seller/earnings');
  return res.data.data;
}

export async function fetchEarningsSummary() {
  const res = await api.get<{ success: true; data: EarningsSummary }>('/seller/earnings/summary');
  return res.data.data;
}
