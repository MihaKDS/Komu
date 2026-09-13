import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

type GoogleBookVolume = {
  id: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    language?: string;
    categories?: string[];
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    industryIdentifiers?: {
      type?: string;
      identifier?: string;
    }[];
  };
};

@Injectable()
export class GoogleBooksService {

  // ============================================================
  // BOOK SEARCH
  // ============================================================

  async searchBooks(query: string) {
    if (!query?.trim()) {
      throw new BadRequestException(
        'A search query is required.',
      );
    }

    const apiKey =
      process.env.GOOGLE_BOOKS_API_KEY;

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Google Books is not configured.',
      );
    }

    const url = new URL(
      'https://www.googleapis.com/books/v1/volumes',
    );

    url.searchParams.set(
      'q',
      query.trim(),
    );

    url.searchParams.set(
      'maxResults',
      '20',
    );

    url.searchParams.set(
      'printType',
      'books',
    );

    url.searchParams.set(
      'key',
      apiKey,
    );

    let response: Response;

        response = await this.fetchWithRetry(
        url.toString(),
        );

        if (!response.ok) {
        const errorText = await response.text();

        console.error(
            'Google Books API error:',
            response.status,
            errorText,
        );

        throw new BadGatewayException(
            `Google Books search failed: ${response.status}`,
        );
        }

    const data = (await response.json()) as {
      items?: GoogleBookVolume[];
    };

    return (data.items ?? []).map(
      (book) => ({
        id: book.id,

        title:
          book.volumeInfo?.title ?? '',

        authors:
          book.volumeInfo?.authors ?? [],

        description:
          book.volumeInfo?.description ?? '',

        releaseYear:
          Number(
            book.volumeInfo?.publishedDate
              ?.slice(0, 4),
          ) || null,

        language:
          book.volumeInfo?.language ?? null,

        categories:
          book.volumeInfo?.categories ?? [],

        poster:
          book.volumeInfo?.imageLinks
            ?.thumbnail ?? null,
      }),
    );
  }


  // ============================================================
  // BOOK DETAILS
  // ============================================================

  async getBookDetails(id: string) {
    if (!id?.trim()) {
      throw new BadRequestException(
        'A book ID is required.',
      );
    }

    const apiKey =
      process.env.GOOGLE_BOOKS_API_KEY;

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Google Books is not configured.',
      );
    }

    const url = new URL(
      `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(id)}`,
    );

    url.searchParams.set(
      'key',
      apiKey,
    );

    let response: Response;

    try {
      response = await fetch(
        url.toString(),
      );
    } catch {
      throw new BadGatewayException(
        'Google Books could not be reached.',
      );
    }

    if (!response.ok) {
      throw new BadGatewayException(
        'Google Books details fetch failed.',
      );
    }

    const book =
      (await response.json()) as GoogleBookVolume;

    const volumeInfo =
      book.volumeInfo ?? {};

    const identifiers =
      volumeInfo.industryIdentifiers ?? [];

    const isbn10 =
      identifiers.find(
        (item) =>
          item.type === 'ISBN_10',
      )?.identifier ?? null;

    const isbn13 =
      identifiers.find(
        (item) =>
          item.type === 'ISBN_13',
      )?.identifier ?? null;

    return {
      id: book.id,

      title:
        volumeInfo.title ?? '',

      authors:
        volumeInfo.authors ?? [],

      description:
        volumeInfo.description ?? '',

      releaseYear:
        Number(
          volumeInfo.publishedDate
            ?.slice(0, 4),
        ) || null,

      language:
        volumeInfo.language ?? null,

      categories:
        volumeInfo.categories ?? [],

      poster:
        volumeInfo.imageLinks
          ?.thumbnail ?? null,

      isbn10,

      isbn13,
    };
  }
  private async fetchWithRetry(
    url: string,
    attempts = 3,
    ): Promise<Response> {
    for (let attempt = 0; attempt < attempts; attempt++) {
        let response: Response;

        try {
        response = await fetch(url);
        } catch (error) {
        if (attempt === attempts - 1) {
            throw new BadGatewayException(
            'Google Books could not be reached.',
            );
        }

        await this.delay(500 * 2 ** attempt);
        continue;
        }

        if (
        response.ok ||
        ![429, 503].includes(response.status)
        ) {
        return response;
        }

        console.warn(
        `Google Books returned ${response.status}, retrying...`,
        );

        if (attempt < attempts - 1) {
        await this.delay(500 * 2 ** attempt);
        }
    }

    throw new BadGatewayException(
        'Google Books is temporarily unavailable.',
    );
    }

    private delay(ms: number) {
    return new Promise((resolve) =>
        setTimeout(resolve, ms),
    );
    }
}