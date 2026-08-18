import { apiFetch } from "./client";

export function getAllMedia() {
    return apiFetch("/media");
}

export function getMedia(id) {
    return apiFetch(`/media/${id}`);
}

export function getSellerListings(username) {
    return apiFetch(`/media/seller/${encodeURIComponent(username)}`);
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

export function updateMedia(id, dto) {
    return apiFetch(`/media/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(dto),
    });
}

export function deleteMediaById(id) {
    return apiFetch(`/media/${id}`, {
        method: "DELETE",
    });
}