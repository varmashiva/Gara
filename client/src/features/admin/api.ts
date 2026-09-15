import { api } from '@/api/axios';
import type { Product } from '@/types/product';
import type { HeroBanner } from '@/types/hero';

export type AdminProduct = Product;

export type HeroBannerEdits = {
  eyebrow?: string;
  headline?: string;
  subtext?: string;
  ctaText?: string;
  ctaLink?: string;
};

export async function fetchAdminHeroBanner() {
  const res = await api.get<{ success: true; data: HeroBanner }>('/admin/hero');
  return res.data.data;
}

export async function updateHeroBanner(payload: HeroBannerEdits) {
  const res = await api.patch<{ success: true; data: HeroBanner }>('/admin/hero', payload);
  return res.data.data;
}

export async function uploadHeroBannerImage(file: File) {
  const form = new FormData();
  form.append('image', file);
  const res = await api.post<{ success: true; data: HeroBanner }>('/admin/hero/image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function removeHeroBannerImage() {
  const res = await api.delete<{ success: true; data: HeroBanner }>('/admin/hero/image');
  return res.data.data;
}

export type AdminReturn = {
  _id: string;
  orderId: string;
  productId: string;
  reason: string;
  status: string;
  requestedAt: string;
};

export type NewAdminProduct = {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  availableStock: number;
};

export async function createAdminProduct(payload: NewAdminProduct) {
  const res = await api.post<{ success: true; data: Product }>('/admin/products', payload);
  return res.data.data;
}

export async function uploadAdminProductImage(productId: string, file: File) {
  const form = new FormData();
  form.append('image', file);
  const res = await api.post<{ success: true; data: Product }>(`/admin/products/${productId}/images`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function deleteAdminProductImage(productId: string, publicId: string) {
  const res = await api.delete<{ success: true; data: Product }>(
    `/admin/products/${productId}/images/${encodeURIComponent(publicId)}`
  );
  return res.data.data;
}

export async function fetchAdminProducts(status?: string) {
  const res = await api.get<{ success: true; data: AdminProduct[] }>('/admin/products', {
    params: status ? { status } : undefined,
  });
  return res.data.data;
}

export async function decideProduct(id: string, decision: 'APPROVED' | 'REJECTED', reviewNotes?: string) {
  const res = await api.patch(`/admin/products/${id}/status`, { decision, reviewNotes });
  return res.data.data;
}

export type AdminProductEdits = {
  categoryId?: string;
  name?: string;
  description?: string;
  price?: number;
  isVeg?: boolean;
  availableStock?: number;
};

export async function updateAdminProduct(id: string, payload: AdminProductEdits) {
  const res = await api.patch<{ success: true; data: Product }>(`/admin/products/${id}`, payload);
  return res.data.data;
}

export async function deleteAdminProduct(id: string) {
  await api.delete(`/admin/products/${id}`);
}

export async function fetchAdminReturns() {
  const res = await api.get<{ success: true; data: AdminReturn[] }>('/admin/returns');
  return res.data.data;
}

export async function decideReturn(id: string, decision: 'APPROVED' | 'REJECTED', notes?: string) {
  const res = await api.patch(`/admin/returns/${id}/decision`, { decision, notes });
  return res.data.data;
}
