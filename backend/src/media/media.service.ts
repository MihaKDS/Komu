import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PublicCopyDto } from '../copy/dto/public-copy.dto';
import { CreateMediaDto } from './dto/create-media.dto';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const media = await this.prisma.media.findMany();
    return this.addCopyCounts(media);
  }

  async create(dto: CreateMediaDto) {
    return this.prisma.media.create({ data: dto });
  }

  async findOne(id: number, userId?: number) {
    const media = await this.prisma.media.findUnique({
      where: { id },
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
      },
    });

    const myCopies = userId
      ? copies.filter((c) => c.userId === userId)
      : [];

      const otherCopies: PublicCopyDto[] = copies
        .filter(
          c =>
            c.userId !== userId &&
            (c.canSell || c.canRent)
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
    });

    return this.addCopyCounts(media);
  }

  private async addCopyCounts(mediaItems: { id: number }[]) {
    if (mediaItems.length === 0) {
      return [];
    }

    const mediaIds = mediaItems.map((media) => media.id);

    const copies = await this.prisma.copy.findMany({
      where: {
        mediaId: {
          in: mediaIds,
        },
      },
      select: {
        mediaId: true,
        edition: true,
      },
    });

    const countsByMedia = new Map<number, { dvd: number; bluray: number; fourk: number }>();

    for (const id of mediaIds) {
      countsByMedia.set(id, { dvd: 0, bluray: 0, fourk: 0 });
    }

    for (const copy of copies) {
      const counts = countsByMedia.get(copy.mediaId);
      if (!counts) continue;
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
