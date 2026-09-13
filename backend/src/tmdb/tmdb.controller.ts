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
  @Get('search/tv')
  searchTvShows(@Query('query') query: string) {
    return this.tmdbService.searchTvShows(query);
  }

  @Get('tv/:id')
  getTvShowDetails(@Param('id', ParseIntPipe) id: number) {
    return this.tmdbService.getTvShowDetails(id);
  }

  @Get('tv/:tvId/season/:seasonNumber')
  getTvSeasonDetails(
    @Param('tvId', ParseIntPipe) tvId: number,
    @Param('seasonNumber', ParseIntPipe) seasonNumber: number,
    @Query('tvShowTitle') tvShowTitle: string,
  ) {
    return this.tmdbService.getTvSeasonDetails(
      tvId,
      seasonNumber,
      tvShowTitle,
    );
  }
}
