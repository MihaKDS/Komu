import { apiFetch } from "./client";

export function getCollectionShare() {
  return apiFetch("/collection/share").then((result) => result.share);
}

export function createCollectionShare(expiresIn) {
  return apiFetch("/collection/share", {
    method: "POST",
    body: JSON.stringify({ expiresIn }),
  });
}

export function revokeCollectionShare() {
  return apiFetch("/collection/share", {
    method: "DELETE",
  });
}

export function getSharedCollection(token) {
  return apiFetch(`/share/${encodeURIComponent(token)}`);
}
