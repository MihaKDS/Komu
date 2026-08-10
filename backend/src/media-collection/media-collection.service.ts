import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMediaCollectionDto } from './dto/create-media-collection.dto';

@Injectable()
export class MediaCollectionService {
  constructor(private prisma: PrismaService) {}

  async search(query: string) {
    const trimmedQuery = query?.trim();

    if (!trimmedQuery) {
      return [];
    }

    return this.prisma.movieCollection.findMany({
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
    if (dto.tmdbId) {
      const existing = await this.prisma.movieCollection.findUnique({
        where: {
          tmdbId: dto.tmdbId,
        },
      });

      if (existing) {
        return existing;
      }
    }

    return this.prisma.movieCollection.create({
      data: {
        title: dto.title.trim(),
        poster: dto.poster ?? null,
        tmdbId: dto.tmdbId,
      },
    });
  }
}
