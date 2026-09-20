import { api } from '@/api/axios';
import type { HomeHighlight } from '@/types/homeHighlight';

export async function fetchHomeHighlight() {
  const res = await api.get<{ success: true; data: HomeHighlight }>('/home-highlights');
  return res.data.data;
}
