import { api } from '@/api/axios';
import { Product } from '@/types/product';

export async function fetchMyProducts() {
  const res = await api.get<{ success: true; data: Product[] }>('/seller/products');
  return res.data.data;
}

export type NewProduct = {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  availableStock: number;
};

export async function createMyProduct(payload: NewProduct) {
  const res = await api.post<{ success: true; data: Product }>('/seller/products', payload);
  return res.data.data;
}

export async function submitForReview(id: string) {
  const res = await api.post<{ success: true; data: Product }>(`/seller/products/${id}/submit`);
  return res.data.data;
}

export async function uploadProductImage(productId: string, file: File) {
  const form = new FormData();
  form.append('image', file);
  const res = await api.post<{ success: true; data: Product }>(`/seller/products/${productId}/images`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}
