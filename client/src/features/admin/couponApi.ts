import { api } from '@/api/axios';

export type Coupon = {
  _id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  usageLimit?: number;
  usedCount: number;
  status: string;
  startDate: string;
  endDate: string;
};

export type NewCoupon = {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  usageLimit?: number;
  perUserLimit?: number;
  startDate: string;
  endDate: string;
};

export async function fetchCoupons() {
  const res = await api.get<{ success: true; data: Coupon[] }>('/admin/coupons');
  return res.data.data;
}

export async function createCoupon(payload: NewCoupon) {
  const res = await api.post<{ success: true; data: Coupon }>('/admin/coupons', payload);
  return res.data.data;
}

export async function updateCouponStatus(id: string, status: 'ACTIVE' | 'DISABLED') {
  const res = await api.patch<{ success: true; data: Coupon }>(`/admin/coupons/${id}`, { status });
  return res.data.data;
}
