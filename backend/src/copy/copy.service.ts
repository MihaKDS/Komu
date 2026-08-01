import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCopyDto } from './dto/create-copy.dto';
import { UpdateCopyDto } from './dto/update-copy.dto';
import { PublicCopyDto } from './dto/public-copy.dto';

@Injectable()
export class CopyService {
  constructor(private prisma: PrismaService) {}

async findByMediaId(mediaId: number): Promise<PublicCopyDto[]> {

  const copies = await this.prisma.copy.findMany({
    where: {
      mediaId,
    },

    select: {
      id: true,

      edition: true,
      includesBluRay: true,

      condition: true,
      listingNote: true,

      canSell: true,
      sellPrice: true,

      canRent: true,
      rentPrice: true,
      deposit: true,

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

    edition: copy.edition,
    includesBluRay: copy.includesBluRay,

    condition: copy.condition,
    listingNote: copy.listingNote,

    canSell: copy.canSell,
    sellPrice: copy.sellPrice,

    canRent: copy.canRent,
    rentPrice: copy.rentPrice,
    deposit: copy.deposit,

    owner: {
      username: copy.user.username,
      city: copy.user.city,
    },
  }));
}

  async findByUser(userId: number) {
    return this.prisma.copy.findMany({
      where: {
        userId,
      },
      include: {
        media: {
          include: {
            movieCollection: true,
          },
        },
        boxSet: true,
      },
    });
  }

  async create(dto: CreateCopyDto, userId: number) {
    if (dto.partOfBox) {
      return this.createBoxSet(dto, userId);
    }

    return this.createSingleCopy(dto, userId);
  }

  private async createSingleCopy(
    dto: CreateCopyDto,
    userId: number,
  ) {
    return this.prisma.copy.create({
      data: {
        mediaId: dto.mediaIds[0],
        userId,
        edition: dto.edition,
        includesBluRay: dto.includesBluRay,
      },
    });
  }

  private async createBoxSet(
    dto: CreateCopyDto,
    userId: number,
  ) {
    return this.prisma.$transaction(async (prisma) => {

      const boxSet = await prisma.boxSet.create({
        data: {},
      });

      const copies = await Promise.all(
        dto.mediaIds.map((mediaId) =>
          prisma.copy.create({
            data: {
              mediaId,
              userId,
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

    return this.prisma.copy.update({
      where: {
        id,
      },
      data: {
        listingNote: dto.listingNote ? dto.listingNote : null,

        canSell: dto.canSell,
        sellPrice: dto.canSell ? dto.sellPrice : null,

        canRent: dto.canRent,
        rentPrice: dto.canRent ? dto.rentPrice : null,
        deposit: dto.canRent ? dto.deposit : null,
      },
    });
  }

  async remove(
    id: number,
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
          rentPrice: original.rentPrice,
          deposit: original.deposit,
        },
      });

      return {
        original: updatedOriginal,
        bluRay: bluRayCopy,
      };
    });
  }
}