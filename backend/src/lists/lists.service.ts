import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMediaListDto } from './dto/update-media-list.dto';

@Injectable()
export class ListsService {
  constructor(private readonly prisma: PrismaService) {}

  findByUser(userId: number) {
    return this.prisma.mediaList.findMany({
      where: { userId },
      include: { media: true },
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  findByMedia(mediaId: number, userId: number) {
    return this.prisma.mediaList.findUnique({
      where: {
        userId_mediaId: {
          userId,
          mediaId,
        },
      },
      include: { media: true },
    });
  }

  async upsert(mediaId: number, userId: number, dto: UpdateMediaListDto) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
      select: { id: true },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    const where = {
      userId_mediaId: {
        userId,
        mediaId,
      },
    };
    const existing = await this.prisma.mediaList.findUnique({ where });
    const note = dto.note === undefined ? undefined : dto.note?.trim() || null;
    const resultingNote = note === undefined ? existing?.note : note;
    const isReview = dto.isReview === undefined
      ? resultingNote ? undefined : false
      : dto.isReview && Boolean(resultingNote);
    const status =
      dto.progress !== undefined && existing?.status === 'TO_WATCH'
        ? 'WATCHING'
        : dto.status;

    return this.prisma.mediaList.upsert({
      where,
      create: {
        userId,
        mediaId,
        status,
        progress: dto.progress ?? null,
        note: note ?? null,
        isReview: isReview ?? false,
      },
      update: {
        status,
        progress: dto.progress === undefined ? undefined : dto.progress,
        note,
        isReview,
      },
      include: { media: true },
    });
  }

  async remove(mediaId: number, userId: number) {
    await this.prisma.mediaList.deleteMany({
      where: {
        userId,
        mediaId,
      },
    });

    return { success: true };
  }
}
