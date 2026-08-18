import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMediaCollectionDto } from './dto/create-media-collection.dto';
import { UpdateMediaCollectionMediaDto } from './dto/update-media-collection.dto';
import { UpdateMediaCollectionInfoDto } from './dto/update-media-collection-info.dto';

@Injectable()
export class MediaCollectionService {
  constructor(private prisma: PrismaService) {}

  async search(query: string) {
    const trimmedQuery = query?.trim();

    if (!trimmedQuery) {
      return [];
    }

    return this.prisma.mediaCollection.findMany({
      where: {
        title: {
          contains: trimmedQuery,
          mode: 'insensitive',
        },
      },
      orderBy: {
        title: 'asc',
      },
      take: 10,
    });
  }

async create(dto: CreateMediaCollectionDto) {

  const title = dto.title.trim();

  if (!title) {
    throw new BadRequestException(
      'Collection title is required.',
    );
  }

  if (dto.tmdbId) {
    const existing =
      await this.prisma.mediaCollection.findUnique({
        where: {
          tmdbId: dto.tmdbId,
        },
      });

    if (existing) {
      return existing;
    }
  }

  return this.prisma.mediaCollection.create({
    data: {
      title,
      category: dto.category,
      poster: dto.poster ?? null,
      tmdbId: dto.tmdbId ?? null,
      overview: dto.overview ?? null,
    },
  });
}
  async updateMedia(
  collectionId: number,
  dto: UpdateMediaCollectionMediaDto,
) {
  const collection =
    await this.prisma.mediaCollection.findUnique({
      where: {
        id: collectionId,
      },
    });


  if (!collection) {
    throw new NotFoundException(
      'Media collection not found',
    );
  }


  /*
   * Make sure all submitted media exist.
   */

  const media = await this.prisma.media.findMany({
    where: {
      id: {
        in: dto.mediaIds,
      },
    },

    select: {
      id: true,
      mediaCollectionId: true,
    },
  });


  if (media.length !== dto.mediaIds.length) {
    throw new BadRequestException(
      'One or more media items could not be found.',
    );
  }


  /*
   * A media item can only belong to one collection.
   *
   * Do not silently move media from another
   * collection.
   */

  const belongsToOtherCollection =
    media.find(
      item =>
        item.mediaCollectionId !== null &&
        item.mediaCollectionId !== collectionId,
    );


  if (belongsToOtherCollection) {
    throw new BadRequestException(
      `Media #${belongsToOtherCollection.id} already belongs to another collection.`,
    );
  }


  return this.prisma.$transaction(
    async tx => {

      /*
       * First remove all current members from
       * this collection.
       *
       * This also handles removed media.
       */

      await tx.media.updateMany({
        where: {
          mediaCollectionId: collectionId,
        },

        data: {
          mediaCollectionId: null,
          collectionPosition: null,
        },
      });


      /*
       * Add the submitted media back in the
       * exact order received.
       */

      for (
        let index = 0;
        index < dto.mediaIds.length;
        index++
      ) {

        await tx.media.update({
          where: {
            id: dto.mediaIds[index],
          },

          data: {
            mediaCollectionId: collectionId,

            collectionPosition:
              index + 1,
          },
        });

      }


      /*
       * Return the updated collection.
       */

      return tx.mediaCollection.findUnique({
        where: {
          id: collectionId,
        },

        include: {
          medias: {
            orderBy: {
              collectionPosition: 'asc',
            },
          },
        },
      });

    },
  );
}
async update(
  collectionId: number,
  dto: UpdateMediaCollectionInfoDto,
) {
  const collection =
    await this.prisma.mediaCollection.findUnique({
      where: {
        id: collectionId,
      },
    });

  if (!collection) {
    throw new NotFoundException(
      'Media collection not found',
    );
  }

  /*
   * Prevent duplicate TMDB collections.
   *
   * Allow the current collection to keep its
   * existing TMDB ID.
   */
  if (dto.tmdbId) {
    const existing =
      await this.prisma.mediaCollection.findFirst({
        where: {
          tmdbId: dto.tmdbId,
          NOT: {
            id: collectionId,
          },
        },
      });

    if (existing) {
      throw new BadRequestException(
        'Another collection already uses this TMDB ID.',
      );
    }
  }

  return this.prisma.mediaCollection.update({
    where: {
      id: collectionId,
    },

    data: {
      title: dto.title.trim(),
      category: dto.category,
      poster: dto.poster?.trim() || null,
      tmdbId: dto.tmdbId ?? null,
      overview: dto.overview?.trim() || null,
    },
  });
}
async remove(collectionId: number) {
  const collection =
    await this.prisma.mediaCollection.findUnique({
      where: {
        id: collectionId,
      },

      include: {
        medias: {
          select: {
            id: true,
          },
        },
      },
    });

  if (!collection) {
    throw new NotFoundException(
      'Media collection not found',
    );
  }

  if (collection.medias.length > 0) {
    throw new BadRequestException(
      'Cannot delete a collection that still contains media. Remove all media first.',
    );
  }

  return this.prisma.mediaCollection.delete({
    where: {
      id: collectionId,
    },
  });
}
}
