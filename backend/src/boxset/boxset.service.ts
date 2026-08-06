import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TradeStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddBoxSetMediaDto } from './dto/add-boxset-media.dto';

const ACTIVE_TRADE_STATUSES = [TradeStatus.REQUESTED, TradeStatus.ACCEPTED, TradeStatus.RENTING];

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
                id: true,
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
      ownerId: boxSet.copies[0]?.userId ?? null,
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
          id: copy.user.id,
          username: copy.user.username,
          city: copy.user.city,
        },
      })),
    };
  }

  async addMedia(id: number, dto: AddBoxSetMediaDto, userId: number) {
    await this.ensureBoxSetOwnedByUser(id, userId);

    const uniqueMediaIds = [...new Set(dto.mediaIds)];
    const medias = await this.prisma.media.findMany({
      where: {
        id: {
          in: uniqueMediaIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (medias.length !== uniqueMediaIds.length) {
      throw new NotFoundException('One or more media items were not found');
    }

    const existingCopies = await this.prisma.copy.findMany({
      where: {
        boxSetId: id,
        userId,
        mediaId: {
          in: uniqueMediaIds,
        },
      },
      select: {
        mediaId: true,
      },
    });

    if (existingCopies.length > 0) {
      throw new BadRequestException('One or more selected movies are already part of this box set');
    }

    await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        uniqueMediaIds.map((mediaId) =>
          tx.copy.create({
            data: {
              mediaId,
              userId,
              boxSetId: id,
              edition: dto.edition,
              includesBluRay: dto.includesBluRay,
            },
          }),
        ),
      );
    });

    return this.findOne(id);
  }

  async removeMedia(id: number, mediaId: number, userId: number) {
    await this.ensureBoxSetOwnedByUser(id, userId);

    const copiesToRemove = await this.prisma.copy.findMany({
      where: {
        boxSetId: id,
        userId,
        mediaId,
      },
      select: {
        id: true,
      },
    });

    if (copiesToRemove.length === 0) {
      throw new NotFoundException('Movie is not part of this box set');
    }

    const copyIds = copiesToRemove.map((copy) => copy.id);
    const activeTradeItem = await this.prisma.tradeItem.findFirst({
      where: {
        copyId: {
          in: copyIds,
        },
        trade: {
          status: {
            in: ACTIVE_TRADE_STATUSES,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (activeTradeItem) {
      throw new ForbiddenException('Cannot remove a movie that is part of an active trade');
    }

    await this.prisma.copy.updateMany({
      where: {
        id: {
          in: copyIds,
        },
      },
      data: {
        boxSetId: null,
      },
    });

    return this.findOne(id);
  }

  async remove(id: number, userId: number) {
    await this.ensureBoxSetOwnedByUser(id, userId);

    const copies = await this.prisma.copy.findMany({
      where: {
        boxSetId: id,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (copies.length === 0) {
      throw new NotFoundException('No copies found for this box set');
    }

    const copyIds = copies.map((copy) => copy.id);
    const tradeItem = await this.prisma.tradeItem.findFirst({
      where: {
        copyId: {
          in: copyIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (tradeItem) {
      throw new ForbiddenException('Cannot delete this box set because one or more copies are linked to trade history');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.copy.deleteMany({
        where: {
          id: {
            in: copyIds,
          },
        },
      });

      await tx.boxSet.delete({
        where: {
          id,
        },
      });
    });

    return {
      success: true,
    };
  }

  private async ensureBoxSetOwnedByUser(id: number, userId: number) {
    const boxSet = await this.prisma.boxSet.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        copies: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!boxSet) {
      throw new NotFoundException('Box set not found');
    }

    if (boxSet.copies.length === 0) {
      throw new ForbiddenException('Empty box set cannot be edited');
    }

    const hasForeignOwner = boxSet.copies.some((copy) => copy.userId !== userId);
    if (hasForeignOwner) {
      throw new ForbiddenException('You do not own this box set');
    }
  }
}
