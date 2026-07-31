import { apiFetch } from "./client";

export function getCopiesByMediaId(id) {
    return apiFetch(`/copies/media/${id}`);
}

export function createCopy(copy) {
    return apiFetch("/copies", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(copy),
    });
}

export function getMyCopies() {
    return apiFetch("/copies/my");
}

export function updateCopy(id, dto) {
    return apiFetch(`/copies/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(dto),
    });
}

export function deleteCopyById(id) {
    return apiFetch(`/copies/${id}`, {
        method: "DELETE",
    });
}

export function splitCopyById(id) {
    return apiFetch(`/copies/${id}/split`, {
        method: "POST",
    });
}