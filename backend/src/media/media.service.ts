import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PublicCopyDto } from '../copy/dto/public-copy.dto';
import { CreateMediaDto } from './dto/create-media.dto';
import { TmdbService } from '../tmdb/tmdb.service';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService, private tmdb: TmdbService) {}

  async findAll() {
    const media = await this.prisma.media.findMany({
      include: {
        movieCollection: {
          select: {
            id: true,
            title: true,
            tmdbId: true,
            poster: true,
          },
        },
      },
    });

    return this.addCopyCounts(media);
  }

  async create(dto: CreateMediaDto) {
    // If the DTO carries TMDb collection info, upsert the MovieCollection and link it
    let movieCollectionId: number | undefined = undefined;
    let upsertedCollection: any = null;
    if ((dto as any).movieCollection) {
      const mc = (dto as any).movieCollection;
      if (mc.tmdbId) {
        upsertedCollection = await this.prisma.movieCollection.upsert({
          where: { tmdbId: mc.tmdbId },
          update: {
            title: mc.title ?? undefined,
            poster: mc.poster ?? undefined,
          },
          create: {
            tmdbId: mc.tmdbId,
            title: mc.title ?? 'Collection',
            poster: mc.poster ?? null,
          },
        });
        movieCollectionId = upsertedCollection.id;
      } else if (mc.title) {
        const existing = await this.prisma.movieCollection.findFirst({ where: { title: mc.title } });
        if (existing) {
          movieCollectionId = existing.id;
          upsertedCollection = existing;
        } else {
          const created = await this.prisma.movieCollection.create({ data: { title: mc.title, poster: mc.poster ?? null } });
          movieCollectionId = created.id;
          upsertedCollection = created;
        }
      }
    }

    const createData: any = {
      title: dto.title,
      description: dto.description,
      releaseYear: dto.releaseYear,
      poster: dto.poster ?? null,
      category: dto.category,
      tmdbId: dto.tmdbId ?? undefined,
    };
    if (movieCollectionId) createData.movieCollectionId = movieCollectionId;

    const createdMedia = await this.prisma.media.create({ data: createData });

    // If requested, import other movies from the TMDb collection (best-effort matching by title/releaseYear)
    if ((dto as any).importCollectionMembers && upsertedCollection && upsertedCollection.tmdbId) {
      try {
        const collection = await this.tmdb.getCollection(upsertedCollection.tmdbId);
        if (collection && Array.isArray(collection.parts)) {
          // Sort by release_date ascending so collectionPosition reflects chronological order
          const sortedParts = [...collection.parts].sort((a, b) => {
            const yearA = a.release_date ? Number(a.release_date.slice(0, 4)) : 9999;
            const yearB = b.release_date ? Number(b.release_date.slice(0, 4)) : 9999;
            return yearA - yearB;
          });

          const ops: any[] = [];
          for (let i = 0; i < sortedParts.length; i++) {
            const part = sortedParts[i];
            const year = part.release_date ? Number(part.release_date.slice(0, 4)) : dto.releaseYear || new Date().getFullYear();
            const matchByTmdbId = part.id ? { tmdbId: part.id } : undefined;
            const matchByTitleYear = { title: part.title, releaseYear: year };
            const existing = await this.prisma.media.findFirst({
              where: matchByTmdbId
                ? {
                    OR: [matchByTmdbId, matchByTitleYear],
                  }
                : matchByTitleYear,
            });

            if (existing) {
              const updateData: any = {
                movieCollectionId,
                collectionPosition: i + 1,
              };
              if (!existing.tmdbId && part.id) {
                updateData.tmdbId = part.id;
              }
              ops.push(this.prisma.media.update({ where: { id: existing.id }, data: updateData }));
            } else {
              ops.push(
                this.prisma.media.create({
                  data: {
                    title: part.title,
                    description: '',
                    releaseYear: year,
                    poster: part.poster_path ? `https://image.tmdb.org/t/p/w342${part.poster_path}` : null,
                    category: 'MOVIE',
                    tmdbId: part.id,
                    movieCollectionId,
                    collectionPosition: i + 1,
                  },
                }),
              );
            }
          }
          if (ops.length) await this.prisma.$transaction(ops);
        }
      } catch (err) {
        // If TMDb fetch fails, ignore and return created media; admin can import later
        console.error('Failed to import collection members', err);
      }
    }

    return createdMedia;
  }

  async findOne(id: number, userId?: number) {
    const media = await this.prisma.media.findUnique({
      where: { id },
      include: {
        movieCollection: {
          select: {
            id: true,
            title: true,
            tmdbId: true,
            poster: true,
          },
        },
      },
    });

    if (!media) {
      throw new NotFoundException();
    }

    const copies = await this.prisma.copy.findMany({
      where: {
        mediaId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            city: true,
          },
        },
        boxSet: {
          select: {
            id: true,
            title: true,
            name: true,
            listingNote: true,
            canSell: true,
            sellPrice: true,
            canRent: true,
            rentPrice: true,
            deposit: true,
            _count: {
              select: {
                copies: true,
              },
            },
          },
        },
      },
    });

    // If this media belongs to a collection, load the other medias in that collection
    let collectionMedias: Array<{ id: number; title: string; poster: string | null; collectionPosition: number | null }> = [];
    if (media.movieCollectionId) {
      collectionMedias = await this.prisma.media.findMany({
        where: { movieCollectionId: media.movieCollectionId },
        orderBy: { collectionPosition: 'asc' },
        select: { id: true, title: true, collectionPosition: true, poster: true },
      });
    }

    const myCopies = userId
      ? copies.filter((c) => c.userId === userId)
      : [];

      const otherCopies: PublicCopyDto[] = copies
        .filter(
          c =>
            c.userId !== userId &&
            (c.canSell || c.canRent || c.boxSet?.canRent || c.boxSet?.canSell)
        )
      .map((copy) => ({
        id: copy.id,

        edition: copy.edition,
        includesBluRay: copy.includesBluRay,

        condition: copy.condition,

        canSell: copy.canSell,
        sellPrice: copy.sellPrice,

        canRent: copy.canRent,
        rentPrice: copy.rentPrice,
        deposit: copy.deposit,

        boxSet: copy.boxSet
          ? {
              id: copy.boxSet.id,
              title: copy.boxSet.title,
              name: copy.boxSet.name,
              listingNote: copy.boxSet.listingNote,
              canSell: copy.boxSet.canSell,
              sellPrice: copy.boxSet.sellPrice,
              canRent: copy.boxSet.canRent,
              rentPrice: copy.boxSet.rentPrice,
              deposit: copy.boxSet.deposit,
            }
          : null,

        owner: {
          username: copy.user.username,
          city: copy.user.city,
        },
      }));
      
      const otherOwnersCount = copies.filter(
        c => c.userId !== userId
      ).length;

    return {
      media,
      myCopies,
      otherOwnersCount,
      otherCopies,
      collection: media.movieCollectionId
        ? {
            id: media.movieCollectionId,
            title: media.movieCollection?.title ?? null,
            medias: collectionMedias,
          }
        : null,
    };
  }

  async search(query: string) {
    const media = await this.prisma.media.findMany({
      where: {
        title: {
          contains: query,
          mode: 'insensitive',
        },
      },
      orderBy: {
        title: 'asc',
      },
      take: 20,
      include: {
        movieCollection: {
          select: {
            id: true,
            title: true,
            tmdbId: true,
            poster: true,
          },
        },
      },
    });

    return this.addCopyCounts(media);
  }

  private async addCopyCounts(mediaItems: { id: number }[]) {
    if (mediaItems.length === 0) {
      return [];
    }

    const mediaIds = mediaItems.map((media) => media.id);

    const countsByMedia = new Map<
      number,
      { dvd: number; bluray: number; fourk: number; availableCopies: number; hasSell: boolean; hasRent: boolean }
    >();

    for (const id of mediaIds) {
      countsByMedia.set(id, {
        dvd: 0,
        bluray: 0,
        fourk: 0,
        availableCopies: 0,
        hasSell: false,
        hasRent: false,
      });
    }

    const copiesWithAvailability = await this.prisma.copy.findMany({
      where: {
        mediaId: {
          in: mediaIds,
        },
      },
      select: {
        mediaId: true,
        edition: true,
        canSell: true,
        canRent: true,
      },
    });

    for (const copy of copiesWithAvailability) {
      const counts = countsByMedia.get(copy.mediaId);
      if (!counts) continue;
      if (copy.canSell || copy.canRent) {
        counts.availableCopies++;
      }
      if (copy.canSell) counts.hasSell = true;
      if (copy.canRent) counts.hasRent = true;

      switch (copy.edition) {
        case 'DVD':
          counts.dvd++;
          break;
        case 'BLURAY':
          counts.bluray++;
          break;
        case 'UHD_4K':
          counts.fourk++;
          break;
      }
    }

    return mediaItems.map((item) => ({
      ...item,
      ...countsByMedia.get(item.id),
    }));
  }
}
