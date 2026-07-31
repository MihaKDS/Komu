import { apiFetch } from "./client";

export function getAllMedia() {
    return apiFetch("/media");
}

export function getMedia(id) {
    return apiFetch(`/media/${id}`);
}

export function searchMedia(query) {
    return apiFetch(
        `/media/search?query=${encodeURIComponent(query)}`
    );
}

export function createMedia(media) {
    return apiFetch("/media", {
        method: "POST",
        body: JSON.stringify(media),
    });
}
