import { Controller, Get, Query, Param, ParseIntPipe, BadGatewayException, ServiceUnavailableException } from '@nestjs/common';
import { TmdbService } from './tmdb.service';

@Controller('tmdb')
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  @Get('search')
  search(@Query('query') query: string) {
    return this.tmdbService.searchMovies(query);
  }

  @Get('movie/:id')
  async getMovieDetails(@Param('id', ParseIntPipe) id: number) {
    const token = process.env.TMDB_READ_ACCESS_TOKEN;
    if (!token) throw new ServiceUnavailableException('TMDB is not configured.');

    const url = new URL(`https://api.themoviedb.org/3/movie/${id}`);
    url.searchParams.set('language', 'en-US');

    let response: Response;
    try {
      response = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
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
}
