import { apiFetch } from "./client";

export function searchTmdbMovies(query) {
  return apiFetch(`/tmdb/search?query=${encodeURIComponent(query)}`);
}

export function getTmdbMovieDetails(id) {
  return apiFetch(`/tmdb/movie/${id}`);
}

export function getTmdbCollection(id) {
  return apiFetch(`/tmdb/collection/${id}`);
}
