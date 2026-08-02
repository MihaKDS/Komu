import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BoxSetService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: number) {
    const boxSet = await this.prisma.boxSet.findUnique({
      where: { id },
      include: {
        copies: {
          include: {
            media: {
              include: {
                movieCollection: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
            user: {
              select: {
                username: true,
                city: true,
              },
            },
          },
        },
      },
    });

    if (!boxSet) {
      throw new NotFoundException('Box set not found');
    }

    const mediasById = new Map<number, any>();
    for (const copy of boxSet.copies) {
      if (!mediasById.has(copy.media.id)) {
        mediasById.set(copy.media.id, copy.media);
      }
    }

    const medias = [...mediasById.values()];
    medias.sort((a, b) => {
      if (
        a.movieCollectionId &&
        b.movieCollectionId &&
        a.movieCollectionId === b.movieCollectionId
      ) {
        return (a.collectionPosition ?? 0) - (b.collectionPosition ?? 0);
      }
      return a.title.localeCompare(b.title);
    });

    return {
      id: boxSet.id,
      title: boxSet.title,
      name: boxSet.name,
      listingNote: boxSet.listingNote,
      canSell: boxSet.canSell,
      sellPrice: boxSet.sellPrice,
      canRent: boxSet.canRent,
      rentPrice: boxSet.rentPrice,
      deposit: boxSet.deposit,
      medias,
      copies: boxSet.copies.map((copy) => ({
        id: copy.id,
        edition: copy.edition,
        includesBluRay: copy.includesBluRay,
        condition: copy.condition,
        listingNote: copy.listingNote,
        canSell: copy.canSell,
        sellPrice: copy.sellPrice,
        canRent: copy.canRent,
        rentPrice: copy.rentPrice,
        deposit: copy.deposit,
        media: {
          id: copy.media.id,
          title: copy.media.title,
          poster: copy.media.poster,
          releaseYear: copy.media.releaseYear,
          collectionPosition: copy.media.collectionPosition,
          movieCollection: copy.media.movieCollection,
        },
        owner: {
          username: copy.user.username,
          city: copy.user.city,
        },
      })),
    };
  }
}
