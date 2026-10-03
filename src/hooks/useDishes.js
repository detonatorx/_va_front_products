import { useQuery } from '@tanstack/react-query';
import { request } from '../api/client.js';

export const dishesQueryKey = ['dishes'];

export function useDishes(token) {
  return useQuery({
    queryKey: dishesQueryKey,
    queryFn: ({ signal }) => request('/dishes', token, { signal }),
    enabled: Boolean(token),
    staleTime: 30000,
    retry: false
  });
}
