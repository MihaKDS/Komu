import { apiFetch } from "./client";

export function searchGoogleBooks(query) {
    return apiFetch(
        `/google-books/search?query=${encodeURIComponent(query)}`
    );
}

export function getGoogleBookDetails(id) {
    return apiFetch(
        `/google-books/${encodeURIComponent(id)}`
    );
}