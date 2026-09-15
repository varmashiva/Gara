import { useQuery } from '@tanstack/react-query';
import { fetchHeroBanner } from './api';

export function useHeroBanner() {
  return useQuery({ queryKey: ['hero'], queryFn: fetchHeroBanner, staleTime: 60 * 1000 });
}
