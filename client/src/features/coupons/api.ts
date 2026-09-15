import { api } from '@/api/axios';

export type CouponPreview = {
  discount: number;
  fundedBy: string;
};

export async function previewCoupon(code: string) {
  const res = await api.post<{ success: true; data: CouponPreview }>('/coupons/preview', { code });
  return res.data.data;
}
