import { NotFoundException } from '@nestjs/common';
import { ListsService } from './lists.service';

describe('ListsService', () => {
  const prisma = {
    media: {
      findUnique: jest.fn(),
    },
    mediaList: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  let service: ListsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ListsService(prisma as never);
    prisma.media.findUnique.mockResolvedValue({ id: 12 });
    prisma.mediaList.upsert.mockResolvedValue({ id: 4, mediaId: 12 });
  });

  it('creates a list entry with a user/media unique key', async () => {
    prisma.mediaList.findUnique.mockResolvedValue(null);

    await service.upsert(12, 7, {
      status: 'WISHLIST',
    });

    expect(prisma.mediaList.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_mediaId: { userId: 7, mediaId: 12 } },
        create: expect.objectContaining({
          userId: 7,
          mediaId: 12,
          status: 'WISHLIST',
        }),
      }),
    );
  });

  it('moves To Watch to Watching when progress is supplied', async () => {
    prisma.mediaList.findUnique.mockResolvedValue({
      status: 'TO_WATCH',
    });

    await service.upsert(12, 7, {
      status: 'TO_WATCH',
      progress: 5,
    });

    expect(prisma.mediaList.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          status: 'WATCHING',
          progress: 5,
        }),
      }),
    );
  });

  it('preserves progress and note when those fields are omitted', async () => {
    prisma.mediaList.findUnique.mockResolvedValue({
      status: 'WATCHING',
    });

    await service.upsert(12, 7, {
      status: 'COMPLETED',
    });

    expect(prisma.mediaList.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          status: 'COMPLETED',
          progress: undefined,
          note: undefined,
        }),
      }),
    );
  });

  it('rejects media that does not exist', async () => {
    prisma.media.findUnique.mockResolvedValue(null);

    await expect(
      service.upsert(404, 7, { status: 'WISHLIST' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.mediaList.upsert).not.toHaveBeenCalled();
  });
});
