import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

type TmdbMovie = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
};

type TmdbTvShow = {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string | null;
};

@Injectable()
export class TmdbService {
  async searchMovies(query: string) {
    if (!query?.trim()) {
      throw new BadRequestException('A search query is required.');
    }

    const token = process.env.TMDB_READ_ACCESS_TOKEN;

    if (!token) {
      throw new ServiceUnavailableException(
        'TMDB is not configured.',
      );
    }

    const url = new URL(
      'https://api.themoviedb.org/3/search/movie',
    );

    url.searchParams.set('query', query.trim());
    url.searchParams.set('include_adult', 'false');
    url.searchParams.set('language', 'en-US');

    let response: Response;

    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      throw new BadGatewayException(
        'TMDB could not be reached.',
      );
    }

    if (!response.ok) {
      throw new BadGatewayException(
        'TMDB search failed.',
      );
    }

    const data = (await response.json()) as {
      results?: TmdbMovie[];
    };

    return (data.results ?? []).map((movie) => ({
      id: movie.id,
      title: movie.title,
      description: movie.overview ?? '',
      releaseYear:
        Number(movie.release_date?.slice(0, 4)) || null,
      poster: movie.poster_path
        ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
        : null,
    }));
  }

  async getMovieDetails(id: number) {
    const token = process.env.TMDB_READ_ACCESS_TOKEN;

    if (!token) {
      throw new ServiceUnavailableException(
        'TMDB is not configured.',
      );
    }

    const url = new URL(
      `https://api.themoviedb.org/3/movie/${id}`,
    );

    url.searchParams.set('language', 'en-US');

    let response: Response;

    try {
      response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      throw new BadGatewayException(
        'TMDB could not be reached.',
      );
    }

    if (!response.ok) {
      throw new BadGatewayException(
        'TMDB details fetch failed.',
      );
    }

    const data = await response.json();

    const belongsToCollection =
      data.belongs_to_collection
        ? {
            id: data.belongs_to_collection.id,
            name: data.belongs_to_collection.name,
            poster_path:
              data.belongs_to_collection.poster_path ?? null,
          }
        : null;

    return {
      id: data.id,

      title: data.title,

      description: data.overview ?? '',

      releaseYear:
        Number(data.release_date?.slice(0, 4)) || null,

      poster: data.poster_path
        ? `https://image.tmdb.org/t/p/w342${data.poster_path}`
        : null,

      genres: (data.genres ?? [])
        .map(
          (genre: { name?: string }) => genre.name,
        )
        .filter(Boolean),

      languages: data.original_language
        ? [data.original_language]
        : [],

      belongsToCollection,
    };
  }

  async getCollection(id: number) {
    const token = process.env.TMDB_READ_ACCESS_TOKEN;

    if (!token) {
      throw new ServiceUnavailableException(
        'TMDB is not configured.',
      );
    }

    const url = new URL(
      `https://api.themoviedb.org/3/collection/${id}`,
    );

    url.searchParams.set('language', 'en-US');

    let response: Response;

    try {
      response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      throw new BadGatewayException(
        'TMDB could not be reached.',
      );
    }

    if (!response.ok) {
      throw new BadGatewayException(
        'TMDB collection fetch failed.',
      );
    }

    const data = await response.json();

    const parts = await Promise.all(
      (data.parts ?? []).map(async (p: any) => {
        const movieUrl = new URL(
          `https://api.themoviedb.org/3/movie/${p.id}`,
        );

        movieUrl.searchParams.set(
          'language',
          'en-US',
        );

        let movieResponse: Response;

        try {
          movieResponse = await fetch(
            movieUrl.toString(),
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
        } catch {
          throw new BadGatewayException(
            'TMDB movie details could not be reached.',
          );
        }

        if (!movieResponse.ok) {
          throw new BadGatewayException(
            `TMDB details fetch failed for movie ${p.id}.`,
          );
        }

        const movie =
          await movieResponse.json();

        return {
          id: movie.id,

          title: movie.title,

          description:
            movie.overview ?? '',

          poster_path:
            movie.poster_path ?? null,

          release_date:
            movie.release_date ?? null,

          genres: (movie.genres ?? [])
            .map(
              (genre: { name?: string }) =>
                genre.name,
            )
            .filter(Boolean),

          original_language:
            movie.original_language ?? null,
        };
      }),
    );

    return {
      id: data.id,

      name: data.name,

      poster_path:
        data.poster_path ?? null,

      parts,
    };
  }

  // ============================================================
  // TV SHOW SEARCH
  // ============================================================

  async searchTvShows(query: string) {
    if (!query?.trim()) {
      throw new BadRequestException(
        'A search query is required.',
      );
    }

    const token = process.env.TMDB_READ_ACCESS_TOKEN;

    if (!token) {
      throw new ServiceUnavailableException(
        'TMDB is not configured.',
      );
    }

    const url = new URL(
      'https://api.themoviedb.org/3/search/tv',
    );

    url.searchParams.set(
      'query',
      query.trim(),
    );

    url.searchParams.set(
      'include_adult',
      'false',
    );

    url.searchParams.set(
      'language',
      'en-US',
    );

    let response: Response;

    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      throw new BadGatewayException(
        'TMDB could not be reached.',
      );
    }

    if (!response.ok) {
      throw new BadGatewayException(
        'TMDB TV search failed.',
      );
    }

    const data = (await response.json()) as {
      results?: TmdbTvShow[];
    };

    return (data.results ?? []).map((show) => ({
      id: show.id,

      title: show.name,

      description:
        show.overview ?? '',

      releaseYear:
        Number(
          show.first_air_date?.slice(0, 4),
        ) || null,

      poster: show.poster_path
        ? `https://image.tmdb.org/t/p/w342${show.poster_path}`
        : null,
    }));
  }

  // ============================================================
  // TV SHOW DETAILS
  // ============================================================

  async getTvShowDetails(id: number) {
    const token = process.env.TMDB_READ_ACCESS_TOKEN;

    if (!token) {
      throw new ServiceUnavailableException(
        'TMDB is not configured.',
      );
    }

    const url = new URL(
      `https://api.themoviedb.org/3/tv/${id}`,
    );

    url.searchParams.set(
      'language',
      'en-US',
    );

    let response: Response;

    try {
      response = await fetch(
        url.toString(),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch {
      throw new BadGatewayException(
        'TMDB could not be reached.',
      );
    }

    if (!response.ok) {
      throw new BadGatewayException(
        'TMDB TV details fetch failed.',
      );
    }

    const data = await response.json();

    return {
      id: data.id,

      title: data.name,

      description:
        data.overview ?? '',

      releaseYear:
        Number(
          data.first_air_date?.slice(0, 4),
        ) || null,

      poster: data.poster_path
        ? `https://image.tmdb.org/t/p/w342${data.poster_path}`
        : null,

      genres: (data.genres ?? [])
        .map(
          (genre: { name?: string }) =>
            genre.name,
        )
        .filter(Boolean),

      languages: data.original_language
        ? [data.original_language]
        : [],

      creators: (data.created_by ?? [])
        .map(
          (creator: { name?: string }) =>
            creator.name,
        )
        .filter(Boolean),

      seasons: (data.seasons ?? [])
        .map((season: any) => ({
          id: season.id,

          seasonNumber:
            season.season_number,

          title:
            season.name,

          description:
            season.overview ?? '',

          airDate:
            season.air_date ?? null,

          releaseYear:
            Number(
              season.air_date?.slice(0, 4),
            ) || null,

          poster: season.poster_path
            ? `https://image.tmdb.org/t/p/w342${season.poster_path}`
            : null,

          episodeCount:
            season.episode_count ?? 0,
        }))
        .filter(
          (season: any) =>
            season.seasonNumber > 0,
        ),
    };
  }

  // ============================================================
  // TV SEASON DETAILS
  // ============================================================

  async getTvSeasonDetails(
    tvId: number,
    seasonNumber: number,
    tvShowTitle: string,
  ) {
    const token = process.env.TMDB_READ_ACCESS_TOKEN;

    if (!token) {
      throw new ServiceUnavailableException(
        'TMDB is not configured.',
      );
    }

    const url = new URL(
      `https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}`,
    );

    url.searchParams.set(
      'language',
      'en-US',
    );

    let response: Response;

    try {
      response = await fetch(
        url.toString(),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch {
      throw new BadGatewayException(
        'TMDB could not be reached.',
      );
    }

    if (!response.ok) {
      throw new BadGatewayException(
        'TMDB TV season details fetch failed.',
      );
    }

    const data = await response.json();

    return {
      id: data.id,

      seasonNumber:
        data.season_number,

      title: `${tvShowTitle} — ${data.name}`,

      description:
        data.overview ?? '',

      releaseYear:
        Number(
          data.air_date?.slice(0, 4),
        ) || null,

      poster: data.poster_path
        ? `https://image.tmdb.org/t/p/w342${data.poster_path}`
        : null,

      airDate:
        data.air_date ?? null,

      episodeCount:
        data.episodes?.length ?? 0,
    };
  }
}