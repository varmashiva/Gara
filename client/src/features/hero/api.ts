import { api } from '@/api/axios';
import type { HeroBanner } from '@/types/hero';

export async function fetchHeroBanner() {
  const res = await api.get<{ success: true; data: HeroBanner }>('/hero');
  return res.data.data;
}
