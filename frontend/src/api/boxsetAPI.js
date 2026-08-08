import { apiFetch } from './client';

export function getBoxSetById(id) {
  return apiFetch(`/boxsets/${id}`);
}

export function getMyBoxSets() {
  return apiFetch('/boxsets/my');
}

export function addBoxSetMedia(id, payload) {
  return apiFetch(`/boxsets/${id}/media`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function removeBoxSetMedia(id, mediaId) {
  return apiFetch(`/boxsets/${id}/media/${mediaId}`, {
    method: 'DELETE',
  });
}

export function deleteBoxSet(id) {
  return apiFetch(`/boxsets/${id}`, {
    method: 'DELETE',
  });
}

export function updateBoxSet(id, payload) {
  return apiFetch(`/boxsets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
