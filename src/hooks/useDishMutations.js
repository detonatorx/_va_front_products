import { useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from '../api/client.js';
import { dishesQueryKey } from './useDishes.js';

export function useDishMutations(token) {
  const queryClient = useQueryClient();
  const upsert = (dish) => queryClient.setQueryData(dishesQueryKey, (current = []) =>
    current.some((item) => item.id === dish.id)
      ? current.map((item) => item.id === dish.id ? dish : item) : [dish, ...current]);

  const saveDish = useMutation({
    mutationFn: ({ id, payload }) => request(id ? `/dishes/${id}` : '/dishes', token, {
      method: id ? 'PUT' : 'POST', body: JSON.stringify(payload)
    }),
    onSuccess: upsert
  });

  const uploadPhoto = useMutation({
    mutationFn: ({ dishId, blob }) => {
      const data = new FormData();
      data.append('photo', blob, 'dish.jpg');
      return request(`/dishes/${dishId}/photos`, token, { method: 'POST', body: data });
    },
    onSuccess: upsert
  });

  const setPrimaryPhoto = useMutation({
    mutationFn: ({ dishId, photoId }) => request(`/dishes/${dishId}/photos/${photoId}/primary`, token, { method: 'PATCH' }),
    onSuccess: upsert
  });

  const deletePhoto = useMutation({
    mutationFn: ({ dishId, photoId }) => request(`/dishes/${dishId}/photos/${photoId}`, token, { method: 'DELETE' }),
    onSuccess: upsert
  });

  const deleteDish = useMutation({
    mutationFn: (id) => request(`/dishes/${id}`, token, { method: 'DELETE' }),
    onSuccess: (_result, id) => queryClient.setQueryData(dishesQueryKey, (current = []) =>
      current.filter((dish) => dish.id !== id))
  });

  return { saveDish, uploadPhoto, setPrimaryPhoto, deletePhoto, deleteDish };
}
