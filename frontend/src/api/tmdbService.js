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

// TV SHOWS

export function searchTmdbTvShows(query) {
  return apiFetch(`/tmdb/search/tv?query=${encodeURIComponent(query)}`);
}

export function getTmdbTvShowDetails(id) {
  return apiFetch(`/tmdb/tv/${id}`);
}

export function getTmdbTvSeasonDetails(tvId, seasonNumber, tvShowTitle) {
  return apiFetch(
    `/tmdb/tv/${tvId}/season/${seasonNumber}?tvShowTitle=${encodeURIComponent(tvShowTitle)}`
  );
}