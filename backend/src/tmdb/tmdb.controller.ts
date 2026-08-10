import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { TmdbService } from './tmdb.service';

@Controller('tmdb')
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  @Get('search')
  search(@Query('query') query: string) {
    return this.tmdbService.searchMovies(query);
  }

  @Get('movie/:id')
  getMovieDetails(@Param('id', ParseIntPipe) id: number) {
    return this.tmdbService.getMovieDetails(id);
  }

  @Get('collection/:id')
  getCollection(@Param('id', ParseIntPipe) id: number) {
    return this.tmdbService.getCollection(id);
  }
}
