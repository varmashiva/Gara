import { useQuery } from '@tanstack/react-query';
import { fetchHomeHighlight } from './api';

export function useHomeHighlight() {
  return useQuery({ queryKey: ['home-highlights'], queryFn: fetchHomeHighlight, staleTime: 60 * 1000 });
}
