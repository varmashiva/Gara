import { useQuery } from '@tanstack/react-query';
import { fetchProducts, fetchProduct, fetchCategories } from './api';
import { ProductQuery } from '@/types/product';

export function useProducts(query: ProductQuery) {
  return useQuery({
    queryKey: ['products', query],
    queryFn: () => fetchProducts(query),
    placeholderData: (prev) => prev,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id!),
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });
}
