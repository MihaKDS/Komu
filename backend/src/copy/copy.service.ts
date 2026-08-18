import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TradeStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCopyDto } from './dto/create-copy.dto';
import { UpdateCopyDto } from './dto/update-copy.dto';
import { PublicCopyDto } from './dto/public-copy.dto';
import {
  BulkCopyDto,
  BulkCopyAction,
} from './dto/bulk-copy.dto';
  
const RESERVED_TRADE_STATUSES = [TradeStatus.ACCEPTED, TradeStatus.RENTING];

@Injectable()
export class CopyService {
  constructor(private prisma: PrismaService) {}

async findByMediaId(mediaId: number): Promise<PublicCopyDto[]> {

  const copies = await this.prisma.copy.findMany({
    where: {
      mediaId,
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
      id: true,

      title: true,
      edition: true,
      includesBluRay: true,

      condition: true,
      listingNote: true,

      canSell: true,
      sellPrice: true,

      canRent: true,

      boxSet: {
        select: {
          id: true,
          title: true,
          name: true,
          listingNote: true,
          canSell: true,
          sellPrice: true,
          canRent: true,
        },
      },

      user: {
        select: {
          username: true,
          city: true,
        },
      },
    },
  });

  return copies.map(copy => ({
    id: copy.id,
    title: copy.title,
    edition: copy.edition,
    includesBluRay: copy.includesBluRay,

    condition: copy.condition,
    listingNote: copy.listingNote,

    canSell: copy.canSell,
    sellPrice: copy.sellPrice,

    canRent: copy.canRent,

    owner: {
      username: copy.user.username,
      city: copy.user.city,
    },
  }));
}

  async findByUser(userId: number) {
    const copies = await this.prisma.copy.findMany({
      where: {
        userId,
        isArchived: false,
      },
      include: {
        media: {
          include: {
            mediaCollection: true,
          },
        },
        boxSet: true,
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

    return copies.map((copy) => ({
      ...copy,
      activeTrade: copy.tradeItems[0]?.trade ?? null,
    }));
  }

  async create(dto: CreateCopyDto, userId: number) {
    if (dto.partOfBox) {
      if (dto.existingBoxSetId) {
        return this.addCopiesToExistingBoxSet(dto, userId);
      }
      return this.createBoxSet(dto, userId);
    }

    if(dto.volumes !== undefined && dto.volumes.length > 0) {
      return this.createMultipleCopies(dto, userId);
    }

    return this.createSingleCopy(dto, userId);
  }

private async createMultipleCopies(
    dto: CreateCopyDto,
    userId: number,
  ) {
    return this.prisma.$transaction(async (prisma) => {
      const copies = await Promise.all(
        dto.volumes.map((volume) =>
          prisma.copy.create({
            data: {
              mediaId: dto.mediaIds[0],
              userId,
              title: `Vol. ${volume}`,
              edition: dto.edition,
              includesBluRay: dto.includesBluRay,
            },
          }),
        ),
      );

      return copies;
    });
  }

  private async createSingleCopy(
    dto: CreateCopyDto,
    userId: number,
  ) {
    return this.prisma.copy.create({
      data: {
        mediaId: dto.mediaIds[0],
        userId,
        title: dto.title ?? null,
        edition: dto.edition,
        includesBluRay: dto.includesBluRay,
      },
    });
  }
  
  async findOne(id: number, userId: number) {
  const copy = await this.prisma.copy.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      media: true,
      boxSet: true,
      user: {
        select: {
          id: true,
          username: true,
          city: true,
        },
      },
    },
  });

  if (!copy) {
    throw new NotFoundException('Copy not found');
  }

  return copy;
}

  private async createBoxSet(
    dto: CreateCopyDto,
    userId: number,
  ) {
    return this.prisma.$transaction(async (prisma) => {

      const boxSet = await prisma.boxSet.create({
        data: {
          title: dto.boxSetName ?? null,
          name: dto.boxSetName ?? null,
          listingNote: dto.boxSetListingNote ?? null,
          canSell: dto.boxSetCanSell ?? false,
          sellPrice: dto.boxSetCanSell ? dto.boxSetSellPrice : null,
          canRent: dto.boxSetCanRent ?? false,
        },
      });

      const copies = await Promise.all(
        dto.mediaIds.map((mediaId) =>
          prisma.copy.create({
            data: {
              mediaId,
              userId,
              title: dto.title ?? null,
              edition: dto.edition,
              includesBluRay: dto.includesBluRay,
              boxSetId: boxSet.id,
            },
          }),
        ),
      );

      return {
        boxSet,
        copies,
      };
    });
  }

  private async addCopiesToExistingBoxSet(
    dto: CreateCopyDto,
    userId: number,
  ) {
    const boxSet = await this.prisma.boxSet.findUnique({
      where: {
        id: dto.existingBoxSetId,
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

    if (boxSet.copies.some((copy) => copy.userId !== userId)) {
      throw new ForbiddenException('You do not own this box set');
    }

    return this.prisma.$transaction(async (prisma) => {
      const copies = await Promise.all(
        dto.mediaIds.map((mediaId) =>
          prisma.copy.create({
            data: {
              mediaId,
              userId,
              title: dto.title ?? null,
              edition: dto.edition,
              includesBluRay: dto.includesBluRay,
              boxSetId: boxSet.id,
            },
          }),
        ),
      );

      return {
        boxSetId: boxSet.id,
        copies,
      };
    });
  }

  async update(
    id: number,
    dto: UpdateCopyDto,
    userId: number,
  ) {

    const copy = await this.prisma.copy.findUnique({
      where: { id },
    });

    if (!copy) {
      throw new NotFoundException('Copy not found');
    }

    if (copy.userId !== userId) {
      throw new ForbiddenException(
        'You do not own this copy',
      );
    }

    await this.assertCopyNotInActiveTrade(id);

    const copyData: Prisma.CopyUpdateInput = {
      listingNote: dto.listingNote ? dto.listingNote : null,
      condition: dto.condition,

      canSell: dto.canSell,
      sellPrice: dto.canSell ? dto.sellPrice : null,

      canRent: dto.canRent,
    };

    const boxSetData: any = {};
    if (copy.boxSetId) {
      if (dto.boxSetName !== undefined) {
        boxSetData.name = dto.boxSetName;
        boxSetData.title = dto.boxSetName;
      }
      if (dto.boxSetListingNote !== undefined) {
        boxSetData.listingNote = dto.boxSetListingNote;
      }
      if (dto.boxSetCanSell !== undefined) {
        boxSetData.canSell = dto.boxSetCanSell;
        boxSetData.sellPrice = dto.boxSetCanSell ? dto.boxSetSellPrice : null;
      }
      if (dto.boxSetCanRent !== undefined) {
        boxSetData.canRent = dto.boxSetCanRent;
      }
    }

    const boxSetId = copy.boxSetId;
    if (boxSetId != null && Object.keys(boxSetData).length > 0) {
      return this.prisma.$transaction(async (prisma) => {
        const updatedCopy = await prisma.copy.update({
          where: {
            id,
          },
          data: copyData,
        });

        await prisma.boxSet.update({
          where: {
            id: boxSetId,
          },
          data: boxSetData,
        });

        return updatedCopy;
      });
    }

    return this.prisma.copy.update({
      where: {
        id,
      },
      data: copyData,
    });
  }

async remove(
  id: number,
  userId: number,
) {
  const copy = await this.prisma.copy.findUnique({
    where: { id },
    include: {
      tradeItems: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!copy) {
    throw new NotFoundException('Copy not found');
  }

  if (copy.userId !== userId) {
    throw new ForbiddenException(
      'You do not own this copy',
    );
  }

  await this.assertCopyNotInActiveTrade(id);

  // If the copy has historical trade records,
  // archive it instead of physically deleting it.
  if (copy.tradeItems.length > 0) {
    return this.prisma.copy.update({
      where: {
        id,
      },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        canSell: false,
        canRent: false,
        sellPrice: null,
      },
    });
  }

  // No trade history -> safe to physically delete.
  return this.prisma.copy.delete({
    where: {
      id,
    },
  });
}

  async split(
    id: number,
    userId: number,
  ) {

    return this.prisma.$transaction(async (tx) => {

      const original = await tx.copy.findUnique({
        where: { id },
      });

      if (!original) {
        throw new NotFoundException('Copy not found');
      }

      if (original.userId !== userId) {
        throw new ForbiddenException(
          'You do not own this copy',
        );
      }

      await this.assertCopyNotInActiveTrade(id);

      if (!original.includesBluRay) {
        throw new Error('Copy does not contain a Blu-ray');
      }

      let boxSetId = original.boxSetId;

      if (!boxSetId) {
        const boxSet = await tx.boxSet.create({
          data: {},
        });

        boxSetId = boxSet.id;
      }

      const updatedOriginal = await tx.copy.update({
        where: { id },

        data: {
          includesBluRay: false,
          boxSetId,
        },
      });

      const bluRayCopy = await tx.copy.create({
        data: {
          mediaId: original.mediaId,
          userId: original.userId,

          edition: 'BLURAY',

          includesBluRay: false,

          boxSetId,

          condition: original.condition,

          canSell: original.canSell,
          sellPrice: original.sellPrice,

          canRent: original.canRent,
        },
      });

      return {
        original: updatedOriginal,
        bluRay: bluRayCopy,
      };
    });
  }

  private async assertCopyNotInActiveTrade(copyId: number) {
    const activeTradeItem = await this.prisma.tradeItem.findFirst({
      where: {
        copyId,
        trade: {
          status: {
            in: RESERVED_TRADE_STATUSES,
          },
        },
      },
      select: {
        tradeId: true,
      },
    });

    if (activeTradeItem) {
      throw new ForbiddenException('This copy is currently part of an active trade');
    }
  }

  

async bulkUpdate(
  dto: BulkCopyDto,
  userId: number,
) {
  const copyIds = [...new Set(dto.copyIds)];

  if (copyIds.length === 0) {
    throw new ForbiddenException('No copies selected');
  }

  return this.prisma.$transaction(async (tx) => {

    // Get all selected copies
    const copies = await tx.copy.findMany({
      where: {
        id: {
          in: copyIds,
        },
      },
      select: {
        id: true,
        userId: true,
        boxSetId: true,
      },
    });

    // Make sure every requested copy exists
    if (copies.length !== copyIds.length) {
      throw new NotFoundException(
        'One or more copies were not found',
      );
    }

    // Make sure the user owns every selected copy
    if (copies.some(copy => copy.userId !== userId)) {
      throw new ForbiddenException(
        'You do not own one or more selected copies',
      );
    }

    // Copies inside a box set cannot be deleted here.
    // They must be managed through Box Set Edit.
    if (
      dto.action === BulkCopyAction.DELETE &&
      copies.some(copy => copy.boxSetId !== null)
    ) {
      throw new ForbiddenException(
        'Copies that belong to a box set must be deleted from the Box Set page',
      );
    }

    // No selected copy can currently be involved
    // in an active trade.
    const activeTradeItem =
      await tx.tradeItem.findFirst({
        where: {
          copyId: {
            in: copyIds,
          },
          trade: {
            status: {
              in: RESERVED_TRADE_STATUSES,
            },
          },
        },
        select: {
          copyId: true,
        },
      });

    if (activeTradeItem) {
      throw new ForbiddenException(
        'One or more selected copies are currently part of an active trade',
      );
    }

    /*
     * Find historical trade records.
     *
     * Copies with historical trades cannot be physically
     * deleted because TradeItem still references them.
     * They will instead be archived.
     */
    const tradeItems = await tx.tradeItem.findMany({
      where: {
        copyId: {
          in: copyIds,
        },
      },
      select: {
        copyId: true,
      },
    });

    const copiesWithTradeHistory = new Set(
      tradeItems.map(item => item.copyId),
    );

    const copiesToArchive = copyIds.filter(
      id => copiesWithTradeHistory.has(id),
    );

    const copiesToDelete = copyIds.filter(
      id => !copiesWithTradeHistory.has(id),
    );

    switch (dto.action) {

      case BulkCopyAction.SET_PRICE:

        if (dto.sellPrice == null) {
          throw new ForbiddenException(
            'Sell price is required',
          );
        }

        return tx.copy.updateMany({
          where: {
            id: {
              in: copyIds,
            },
            userId,
          },
          data: {
            canSell: true,
            sellPrice: dto.sellPrice,
          },
        });


      case BulkCopyAction.REMOVE_FROM_SALE:

        return tx.copy.updateMany({
          where: {
            id: {
              in: copyIds,
            },
            userId,
          },
          data: {
            canSell: false,
            sellPrice: null,
          },
        });


      case BulkCopyAction.DELETE: {

        // Copies with historical trades are archived
        // instead of physically deleted.
        if (copiesToArchive.length > 0) {
          await tx.copy.updateMany({
            where: {
              id: {
                in: copiesToArchive,
              },
              userId,
            },
            data: {
              isArchived: true,
              archivedAt: new Date(),

              canSell: false,
              canRent: false,

              sellPrice: null,
            },
          });
        }

        // Copies with no trade history can be
        // physically deleted.
        if (copiesToDelete.length > 0) {
          await tx.copy.deleteMany({
            where: {
              id: {
                in: copiesToDelete,
              },
              userId,
            },
          });
        }

        return {
          archived: copiesToArchive.length,
          deleted: copiesToDelete.length,
        };
      }


      default:
        throw new ForbiddenException(
          'Unsupported bulk action',
        );
    }
  });
}

}
