import { Injectable, NotFoundException } from '@nestjs/common';
import { TradeStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PublicCopyDto } from '../copy/dto/public-copy.dto';
import { CreateMediaDto } from './dto/create-media.dto';
import { TmdbService } from '../tmdb/tmdb.service';

const RESERVED_TRADE_STATUSES = [TradeStatus.ACCEPTED, TradeStatus.RENTING];

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
        tradeItems: {
          where: {
            trade: {
              status: {
                in: RESERVED_TRADE_STATUSES,
              },
            },
          },
          orderBy: {
            trade: {
              updatedAt: 'desc',
            },
          },
          take: 1,
          include: {
            trade: {
              select: {
                id: true,
                status: true,
                type: true,
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
      ? copies
          .filter((c) => c.userId === userId)
          .map((copy) => ({
            ...copy,
            activeTrade: copy.tradeItems[0]?.trade ?? null,
          }))
      : [];

      const otherCopies: PublicCopyDto[] = copies
        .filter(
          c =>
            c.userId !== userId &&
            c.tradeItems.length === 0 &&
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
      
      const otherOwnersCount = otherCopies.length;

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

  async findSellerListings(username: string) {
    const seller = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        city: true,
      },
    });

    if (!seller) {
      throw new NotFoundException();
    }

    const copies = await this.prisma.copy.findMany({
      where: {
        userId: seller.id,
        tradeItems: {
          none: {
            trade: {
              status: {
                in: RESERVED_TRADE_STATUSES,
              },
            },
          },
        },
        OR: [
          { canSell: true },
          { canRent: true },
          { boxSet: { is: { canSell: true } } },
          { boxSet: { is: { canRent: true } } },
        ],
      },
      include: {
        media: {
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

    const saleItems: any[] = [];
    const rentItems: any[] = [];
    const boxGroups = new Map<string, any>();

    const buildMediaShape = (media: any) => ({
      id: media.id,
      title: media.title,
      description: media.description,
      releaseYear: media.releaseYear,
      poster: media.poster,
      category: media.category,
      movieCollectionId: media.movieCollectionId,
      collectionPosition: media.collectionPosition,
      movieCollection: media.movieCollection
        ? {
            id: media.movieCollection.id,
            title: media.movieCollection.title,
            tmdbId: media.movieCollection.tmdbId,
            poster: media.movieCollection.poster,
          }
        : null,
    });

    const pushBoxGroup = (copy: any, listingType: 'SELL' | 'RENT') => {
      if (!copy.boxSet) return;
      const key = `${listingType}-${copy.boxSet.id}`;
      if (!boxGroups.has(key)) {
        boxGroups.set(key, {
          key,
          type: 'boxSet',
          listingType,
          boxSetId: copy.boxSet.id,
          title: copy.boxSet.name || copy.boxSet.title || copy.media.title,
          poster: copy.media.poster,
          category: copy.media.category,
          releaseYear: copy.media.releaseYear,
          boxSet: {
            id: copy.boxSet.id,
            title: copy.boxSet.title,
            name: copy.boxSet.name,
            listingNote: copy.boxSet.listingNote,
            canSell: copy.boxSet.canSell,
            sellPrice: copy.boxSet.sellPrice,
            canRent: copy.boxSet.canRent,
            rentPrice: copy.boxSet.rentPrice,
            deposit: copy.boxSet.deposit,
            copyCount: copy.boxSet._count?.copies ?? 0,
          },
          copyIds: [],
          mediaTitles: [],
          mediaCount: 0,
          formats: {
            DVD: 0,
            BLURAY: 0,
            UHD_4K: 0,
          },
          price: listingType === 'SELL' ? copy.boxSet.sellPrice : copy.boxSet.deposit,
          deposit: listingType === 'RENT' ? copy.boxSet.deposit : null,
        });
      }

      const group = boxGroups.get(key);
      group.copyIds.push(copy.id);
      group.mediaTitles.push(copy.media.title);
      group.mediaCount = group.copyIds.length;
      group.formats[copy.edition] = (group.formats[copy.edition] ?? 0) + 1;
    };

    const pushCopyItem = (copy: any, listingType: 'SELL' | 'RENT') => {
      const item = {
        key: `${listingType}-${copy.id}`,
        type: 'copy',
        listingType,
        mediaId: copy.media.id,
        copyIds: [copy.id],
        title: copy.media.title,
        poster: copy.media.poster,
        category: copy.media.category,
        releaseYear: copy.media.releaseYear,
        edition: copy.edition,
        condition: copy.condition,
        media: buildMediaShape(copy.media),
        price: listingType === 'SELL' ? copy.sellPrice : copy.deposit,
        deposit: listingType === 'RENT' ? copy.deposit : null,
        availableCopies: 1,
        formats: {
          DVD: copy.edition === 'DVD' ? 1 : 0,
          BLURAY: copy.edition === 'BLURAY' ? 1 : 0,
          UHD_4K: copy.edition === 'UHD_4K' ? 1 : 0,
        },
      };

      if (listingType === 'SELL') {
        saleItems.push(item);
      } else {
        rentItems.push(item);
      }
    };

    for (const copy of copies) {
      const hasBoxSetListing = Boolean(copy.boxSet && (copy.boxSet.canSell || copy.boxSet.canRent));

      if (hasBoxSetListing) {
        if (copy.boxSet?.canSell) {
          pushBoxGroup(copy, 'SELL');
        }
        if (copy.boxSet?.canRent) {
          pushBoxGroup(copy, 'RENT');
        }
        continue;
      }

      if (copy.canSell) {
        pushCopyItem(copy, 'SELL');
      }
      if (copy.canRent) {
        pushCopyItem(copy, 'RENT');
      }
    }

    const boxItems = [...boxGroups.values()].sort((a, b) => a.title.localeCompare(b.title));
    for (const item of boxItems) {
      if (item.listingType === 'SELL') {
        saleItems.push(item);
      } else {
        rentItems.push(item);
      }
    }

    return {
      seller,
      saleItems,
      rentItems,
      items: [...saleItems, ...rentItems],
    };
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
        tradeItems: {
          none: {
            trade: {
              status: {
                in: RESERVED_TRADE_STATUSES,
              },
            },
          },
        },
      },
      select: {
        mediaId: true,
        edition: true,
        canSell: true,
        canRent: true,
        boxSet: {
          select: {
            canSell: true,
            canRent: true,
          },
        },
      },
    });

    for (const copy of copiesWithAvailability) {
      const counts = countsByMedia.get(copy.mediaId);
      if (!counts) continue;
      if (copy.canSell || copy.canRent || copy.boxSet?.canSell || copy.boxSet?.canRent) {
        counts.availableCopies++;
      }
      if (copy.canSell || copy.boxSet?.canSell) counts.hasSell = true;
      if (copy.canRent || copy.boxSet?.canRent) counts.hasRent = true;

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
