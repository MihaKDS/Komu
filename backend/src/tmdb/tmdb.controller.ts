import { Controller, Get, Query } from '@nestjs/common';
import { TmdbService } from './tmdb.service';

@Controller('tmdb')
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  @Get('search')
  search(@Query('query') query: string) {
    return this.tmdbService.searchMovies(query);
  }
}
