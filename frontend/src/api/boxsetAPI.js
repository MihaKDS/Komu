import { apiFetch } from './client';

export function getBoxSetById(id) {
  return apiFetch(`/boxsets/${id}`);
}
