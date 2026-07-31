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
}
