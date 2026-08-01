import { BadGatewayException, BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';

type TmdbMovie = { id: number; title: string; overview: string; release_date: string; poster_path: string | null };

@Injectable()
export class TmdbService {
  async searchMovies(query: string) {
    if (!query?.trim()) throw new BadRequestException('A search query is required.');

    const token = process.env.TMDB_READ_ACCESS_TOKEN;
    if (!token) throw new ServiceUnavailableException('TMDB is not configured.');

    const url = new URL('https://api.themoviedb.org/3/search/movie');
    url.searchParams.set('query', query.trim());
    url.searchParams.set('include_adult', 'false');
    url.searchParams.set('language', 'en-US');

    let response: Response;
    try {
      response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      throw new BadGatewayException('TMDB could not be reached.');
    }
    if (!response.ok) throw new BadGatewayException('TMDB search failed.');

    const data = (await response.json()) as { results?: TmdbMovie[] };
    return (data.results ?? []).map((movie) => ({
      id: movie.id,
      title: movie.title,
      description: movie.overview ?? '',
      releaseYear: Number(movie.release_date?.slice(0, 4)) || null,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : null,
    }));
  }

  async getMovieDetails(id: number) {
    const token = process.env.TMDB_READ_ACCESS_TOKEN;
    if (!token) throw new ServiceUnavailableException('TMDB is not configured.');

    const url = new URL(`https://api.themoviedb.org/3/movie/${id}`);
    url.searchParams.set('language', 'en-US');

    let response: Response;
    try {
      response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      throw new BadGatewayException('TMDB could not be reached.');
    }
    if (!response.ok) throw new BadGatewayException('TMDB details fetch failed.');

    const data = await response.json();
    const belongs = data.belongs_to_collection
      ? {
          id: data.belongs_to_collection.id,
          name: data.belongs_to_collection.name,
          poster_path: data.belongs_to_collection.poster_path ?? null,
        }
      : null;

    return {
      id: data.id,
      title: data.title,
      description: data.overview ?? '',
      releaseYear: Number(data.release_date?.slice(0, 4)) || null,
      poster: data.poster_path ? `https://image.tmdb.org/t/p/w342${data.poster_path}` : null,
      belongsToCollection: belongs,
    };
  }

  async getCollection(id: number) {
    const token = process.env.TMDB_READ_ACCESS_TOKEN;
    if (!token) throw new ServiceUnavailableException('TMDB is not configured.');

    const url = new URL(`https://api.themoviedb.org/3/collection/${id}`);
    url.searchParams.set('language', 'en-US');

    let response: Response;
    try {
      response = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      throw new BadGatewayException('TMDB could not be reached.');
    }
    if (!response.ok) throw new BadGatewayException('TMDB collection fetch failed.');

    const data = await response.json();

    return {
      id: data.id,
      name: data.name,
      poster_path: data.poster_path ?? null,
      parts: (data.parts ?? []).map((p: any) => ({
        id: p.id,
        title: p.title,
        poster_path: p.poster_path ?? null,
        release_date: p.release_date ?? null,
      })),
    };
  }
}
