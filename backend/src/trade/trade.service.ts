import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TradeStatus, TradeType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { CreateTradeMessageDto } from './dto/create-trade-message.dto';

const RESERVED_TRADE_STATUSES = [TradeStatus.ACCEPTED, TradeStatus.RENTING];
const AUTO_CANCELLED_REASON = 'Cancelled automatically. Item is no longer available.';

@Injectable()
export class TradeService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTradeDto, buyerId: number) {
    const uniqueCopyIds = [...new Set(dto.copyIds)];

    const copies = await this.prisma.copy.findMany({
      where: {
        id: {
          in: uniqueCopyIds,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        media: {
          select: {
            id: true,
            title: true,
          },
        },
        boxSet: {
          select: {
            id: true,
            canSell: true,
            sellPrice: true,
            canRent: true,

            _count: {
              select: {
                copies: true,
              },
            },
          },
        },
      },
    });

    if (copies.length !== uniqueCopyIds.length) {
      throw new NotFoundException('One or more copies could not be found');
    }

    const sellerIds = [...new Set(copies.map((copy) => copy.userId))];
    if (sellerIds.length !== 1) {
      throw new BadRequestException('All copies in a trade must belong to the same seller');
    }

    const sellerId = sellerIds[0];
    if (sellerId === buyerId) {
      throw new BadRequestException('You cannot create a trade with yourself');
    }

    const conflictingItems = await this.prisma.tradeItem.findMany({
      where: {
        copyId: {
          in: uniqueCopyIds,
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

    if (conflictingItems.length > 0) {
      throw new BadRequestException('One or more selected copies are already part of an active trade');
    }

    const tradeItemCreates = this.buildTradeItemCreates(copies, dto.type);

    const trade = await this.prisma.trade.create({
      data: {
        buyerId,
        sellerId,
        type: dto.type,
        items: {
          create: tradeItemCreates,
        },
        messages: dto.message
          ? {
              create: {
                senderId: buyerId,
                message: dto.message,
              },
            }
          : undefined,
      },
    });

    return this.findOne(trade.id, buyerId);
  }

  async findAll(userId: number) {
    const trades = await this.prisma.trade.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
          },
        },
        seller: {
          select: {
            id: true,
            username: true,
          },
        },
        items: {
          include: {
            copy: {
              include: {
                media: {
                  select: {
                    id: true,
                    title: true,
                    poster: true,
                  },
                },
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    return trades.map((trade) => ({
      id: trade.id,
      type: trade.type,
      status: trade.status,
      createdAt: trade.createdAt,
      updatedAt: trade.updatedAt,
      buyer: trade.buyer,
      seller: trade.seller,
      sellerConfirmedTransfer: trade.sellerConfirmedTransfer,
      buyerConfirmedTransfer: trade.buyerConfirmedTransfer,
      returnRequested: trade.returnRequested,
      cancelledReason: trade.cancelledReason,
      viewerRole: trade.buyerId === userId ? 'buyer' : 'seller',
      items: trade.items.map((item) => ({
        copyId: item.copyId,
        mediaId: item.copy.media.id,
        title: item.copy.media.title,
        poster: item.copy.media.poster,
        agreedPrice: item.agreedPrice,
      })),
      lastMessage: trade.messages[0]
        ? {
            id: trade.messages[0].id,
            message: trade.messages[0].message,
            createdAt: trade.messages[0].createdAt,
            sender: trade.messages[0].sender,
          }
        : null,
    }));
  }

  async findOne(id: number, userId: number) {
    const trade = await this.prisma.trade.findUnique({
      where: { id },
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            city: true,
          },
        },
        seller: {
          select: {
            id: true,
            username: true,
            city: true,
          },
        },
        items: {
          include: {
            copy: {
              include: {
                media: {
                  include: {
                    mediaCollection: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },
                  },
                },
                boxSet: {
                  select: {
                    id: true,
                    title: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    this.ensureParticipant(trade, userId);

    return {
      id: trade.id,
      type: trade.type,
      status: trade.status,
      cancelledReason: trade.cancelledReason,
      sellerConfirmedTransfer: trade.sellerConfirmedTransfer,
      buyerConfirmedTransfer: trade.buyerConfirmedTransfer,
      returnRequested: trade.returnRequested,
      createdAt: trade.createdAt,
      updatedAt: trade.updatedAt,
      viewerRole: trade.buyerId === userId ? 'buyer' : 'seller',
      buyer: trade.buyer,
      seller: trade.seller,
      items: trade.items.map((item) => ({
        id: item.id,
        copyId: item.copyId,
        agreedPrice: item.agreedPrice,
        edition: item.copy.edition,
        media: {
          id: item.copy.media.id,
          title: item.copy.media.title,
          releaseYear: item.copy.media.releaseYear,
          poster: item.copy.media.poster,
          category: item.copy.media.category,
          mediaCollection: item.copy.media.mediaCollection,
        },
        boxSet: item.copy.boxSet,
      })),
      messages: trade.messages.map((message) => ({
        id: message.id,
        message: message.message,
        createdAt: message.createdAt,
        sender: message.sender,
      })),
    };
  }

  async addMessage(id: number, dto: CreateTradeMessageDto, userId: number) {
    const trade = await this.prisma.trade.findUnique({
      where: { id },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        status: true,
      },
    });

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    this.ensureParticipant(trade, userId);

    if (
      trade.status === TradeStatus.REJECTED ||
      trade.status === TradeStatus.CANCELLED ||
      trade.status === TradeStatus.COMPLETED
    ) {
      throw new BadRequestException('Messages can no longer be added to this trade');
    }

    await this.prisma.tradeMessage.create({
      data: {
        tradeId: id,
        senderId: userId,
        message: dto.message,
      },
    });

    return this.findOne(id, userId);
  }

  async accept(id: number, userId: number) {
    const trade = await this.prisma.trade.findUnique({
      where: { id },
      include: {
        items: {
          select: {
            copyId: true,
          },
        },
      },
    });

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    this.ensureSeller(trade, userId);

    if (trade.status !== TradeStatus.REQUESTED) {
      throw new BadRequestException('Only requested trades can be accepted');
    }

    const copyIds = trade.items.map((item) => item.copyId);
    const reservedByOtherTrade = await this.prisma.tradeItem.findFirst({
      where: {
        copyId: {
          in: copyIds,
        },
        tradeId: {
          not: id,
        },
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

    if (reservedByOtherTrade) {
      throw new BadRequestException('One or more items are no longer available');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.trade.update({
        where: { id },
        data: {
          status: TradeStatus.ACCEPTED,
          cancelledReason: null,
        },
      });

      await tx.trade.updateMany({
        where: {
          id: {
            not: id,
          },
          status: TradeStatus.REQUESTED,
          items: {
            some: {
              copyId: {
                in: copyIds,
              },
            },
          },
        },
        data: {
          status: TradeStatus.CANCELLED,
          cancelledReason: AUTO_CANCELLED_REASON,
        },
      });
    });

    return this.findOne(id, userId);
  }

  async reject(id: number, userId: number) {
    const trade = await this.getTradeForAction(id);
    this.ensureSeller(trade, userId);

    if (trade.status !== TradeStatus.REQUESTED) {
      throw new BadRequestException('Only requested trades can be rejected');
    }

    await this.prisma.trade.update({
      where: { id },
      data: {
        status: TradeStatus.REJECTED,
        cancelledReason: null,
      },
    });

    return this.findOne(id, userId);
  }

  async confirmSellerTransfer(id: number, userId: number) {
    const trade = await this.getTradeForAction(id);
    this.ensureSeller(trade, userId);

    if (trade.status !== TradeStatus.ACCEPTED) {
      throw new BadRequestException('Transfer can only be confirmed on accepted trades');
    }

    await this.prisma.trade.update({
      where: { id },
      data: {
        sellerConfirmedTransfer: true,
      },
    });

    await this.finalizeTransferIfReady(id);
    return this.findOne(id, userId);
  }

  async confirmBuyerTransfer(id: number, userId: number) {
    const trade = await this.getTradeForAction(id);
    this.ensureBuyer(trade, userId);

    if (trade.status !== TradeStatus.ACCEPTED) {
      throw new BadRequestException('Transfer can only be confirmed on accepted trades');
    }

    await this.prisma.trade.update({
      where: { id },
      data: {
        buyerConfirmedTransfer: true,
      },
    });

    await this.finalizeTransferIfReady(id);
    return this.findOne(id, userId);
  }

  async requestReturn(id: number, userId: number) {
    const trade = await this.getTradeForAction(id);
    this.ensureBuyer(trade, userId);

    if (trade.type !== TradeType.RENT) {
      throw new BadRequestException('Return can only be requested for rent trades');
    }

    if (trade.status !== TradeStatus.RENTING) {
      throw new BadRequestException('Return can only be requested while trade is renting');
    }

    if (trade.returnRequested) {
      throw new BadRequestException('Return has already been requested');
    }

    await this.prisma.trade.update({
      where: { id },
      data: {
        returnRequested: true,
      },
    });

    return this.findOne(id, userId);
  }

  async acceptReturn(id: number, userId: number) {
    const trade = await this.prisma.trade.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            copy: {
              select: {
                id: true,
                boxSetId: true,
              },
            },
          },
        },
      },
    });

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    this.ensureSeller(trade, userId);

    if (trade.type !== TradeType.RENT) {
      throw new BadRequestException('Only rent trades can be returned');
    }

    if (trade.status !== TradeStatus.RENTING) {
      throw new BadRequestException('Only renting trades can be completed by return');
    }

    if (!trade.returnRequested) {
      throw new BadRequestException('Return has not been requested by borrower');
    }

    const copyIds = trade.items.map((item) => item.copyId);
    const boxSetIds = [...new Set(trade.items.map((item) => item.copy.boxSetId).filter((boxSetId): boxSetId is number => boxSetId != null))];

    await this.prisma.$transaction(async (tx) => {
      await tx.copy.updateMany({
        where: {
          id: {
            in: copyIds,
          },
        },
        data: {
          userId: trade.sellerId,
        },
      });

      if (boxSetIds.length > 0) {
        await tx.boxSet.updateMany({
          where: {
            id: {
              in: boxSetIds,
            },
          },
          data: {
            canSell: false,
            sellPrice: null,
            canRent: false,
          },
        });
      }

      await tx.trade.update({
        where: { id: trade.id },
        data: {
          status: TradeStatus.COMPLETED,
          returnRequested: false,
        },
      });
    });

    return this.findOne(id, userId);
  }

  async findActiveTradeByCopyIds(copyIds: number[]) {
    if (copyIds.length === 0) {
      return [];
    }

    return this.prisma.tradeItem.findMany({
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
      include: {
        trade: {
          select: {
            id: true,
            status: true,
            type: true,
          },
        },
      },
    });
  }

  private async finalizeTransferIfReady(id: number) {
    const trade = await this.prisma.trade.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            copy: {
              select: {
                id: true,
                boxSetId: true,
              },
            },
          },
        },
      },
    });

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    if (!trade.sellerConfirmedTransfer || !trade.buyerConfirmedTransfer || trade.status !== TradeStatus.ACCEPTED) {
      return;
    }

    const copyIds = trade.items.map((item) => item.copyId);
    const boxSetIds = [...new Set(trade.items.map((item) => item.copy.boxSetId).filter((id): id is number => id != null))];

    await this.prisma.$transaction(async (tx) => {
      await tx.copy.updateMany({
        where: {
          id: {
            in: copyIds,
          },
        },
        data: {
          userId: trade.buyerId,
          canSell: false,
          sellPrice: null,
          canRent: false,
        },
      });

      if (boxSetIds.length > 0) {
        await tx.boxSet.updateMany({
          where: {
            id: {
              in: boxSetIds,
            },
          },
          data: {
            canSell: false,
            sellPrice: null,
            canRent: false,
          },
        });
      }

      await tx.trade.update({
        where: { id: trade.id },
        data: {
          status: trade.type === TradeType.RENT ? TradeStatus.RENTING : TradeStatus.COMPLETED,
          cancelledReason: null,
        },
      });
    });
  }

  private buildTradeItemCreates(
    copies: Array<{
      id: number;
      canSell: boolean;
      sellPrice: number | null;
      canRent: boolean;
      media: { title: string };
      boxSet: {
        id: number;
        canSell: boolean;
        sellPrice: number | null;
        canRent: boolean;
        _count: { copies: number };
      } | null;
    }>,
    tradeType: TradeType,
  ) {
    const selectedCountsByBoxSet = new Map<number, number>();

    for (const copy of copies) {
      if (!copy.boxSet?.id) {
        continue;
      }
      selectedCountsByBoxSet.set(copy.boxSet.id, (selectedCountsByBoxSet.get(copy.boxSet.id) ?? 0) + 1);
    }

    return copies.map((copy, index) => {
      const fullBoxSetSelected = Boolean(
        copy.boxSet?.id &&
        selectedCountsByBoxSet.get(copy.boxSet.id) === copy.boxSet._count.copies,
      );

      if (tradeType === TradeType.BUY) {
        if (fullBoxSetSelected && copy.boxSet?.canSell && copy.boxSet.sellPrice != null) {
          return {
            copyId: copy.id,
            agreedPrice: index === copies.findIndex((item) => item.boxSet?.id === copy.boxSet?.id) ? copy.boxSet.sellPrice : 0,
          };
        }

        if (!copy.canSell || copy.sellPrice == null) {
          throw new BadRequestException(`"${copy.media.title}" is not available for purchase`);
        }

        return {
          copyId: copy.id,
          agreedPrice: copy.sellPrice,
        };
      }

      return {
        copyId: copy.id,
        agreedPrice: copy.sellPrice ?? 0,
      };
    });
  }

  private async getTradeForAction(id: number) {
    const trade = await this.prisma.trade.findUnique({
      where: { id },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        status: true,
        type: true,
        returnRequested: true,
      },
    });

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    return trade;
  }

  private ensureParticipant(trade: { buyerId: number; sellerId: number }, userId: number) {
    if (trade.buyerId !== userId && trade.sellerId !== userId) {
      throw new ForbiddenException('You are not part of this trade');
    }
  }

  private ensureSeller(trade: { sellerId: number }, userId: number) {
    if (trade.sellerId !== userId) {
      throw new ForbiddenException('Only the seller can perform this action');
    }
  }

  private ensureBuyer(trade: { buyerId: number }, userId: number) {
    if (trade.buyerId !== userId) {
      throw new ForbiddenException('Only the buyer can perform this action');
    }
  }
}
