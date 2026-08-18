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
export function updateCollection(collectionId, dto) {
    return apiFetch(`/collections/${collectionId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(dto),
    });
}
export function deleteCollectionById(collectionId) {
    return apiFetch(`/collections/${collectionId}`, {
        method: "DELETE",
    });
}

export function updateCollectionMedia(collectionId, mediaIds) {
    return apiFetch(`/collections/${collectionId}/media`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            mediaIds,
        }),
    });
}