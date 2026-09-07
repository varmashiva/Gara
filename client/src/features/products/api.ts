import { api } from '@/api/axios';
import { Product, ProductListResponse, ProductQuery, Category } from '@/types/product';

export async function fetchProducts(query: ProductQuery) {
  const res = await api.get<{ success: true; data: ProductListResponse }>('/products', { params: query });
  return res.data.data;
}

export async function fetchProduct(id: string) {
  const res = await api.get<{ success: true; data: Product }>(`/products/${id}`);
  return res.data.data;
}

export async function fetchCategories() {
  const res = await api.get<{ success: true; data: Category[] }>('/categories');
  return res.data.data;
}
