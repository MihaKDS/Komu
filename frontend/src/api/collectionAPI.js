import { apiFetch } from "./client";

export function searchCollections(query) {
  return apiFetch(`/collections/search?query=${encodeURIComponent(query)}`);
}

export function createCollection(collection) {
  return apiFetch("/collections", {
    method: "POST",
    body: JSON.stringify(collection),
  });
}
