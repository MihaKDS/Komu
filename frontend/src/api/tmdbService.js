import { apiFetch } from "./client";

export function searchTmdbMovies(query) {
  return apiFetch(`/tmdb/search?query=${encodeURIComponent(query)}`);
}
