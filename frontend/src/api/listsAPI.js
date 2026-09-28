import { apiFetch } from "./client";

export function getMyLists() {
    return apiFetch("/lists/my");
}

export function getMediaList(mediaId) {
    return apiFetch(`/lists/media/${mediaId}`);
}

export function saveMediaList(mediaId, entry) {
    return apiFetch(`/lists/media/${mediaId}`, {
        method: "PUT",
        body: JSON.stringify(entry),
    });
}

export function removeMediaList(mediaId) {
    return apiFetch(`/lists/media/${mediaId}`, {
        method: "DELETE",
    });
}
