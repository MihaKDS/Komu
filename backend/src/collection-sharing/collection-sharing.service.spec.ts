import { NotFoundException } from '@nestjs/common';
import { CollectionSharingService } from './collection-sharing.service';

describe('CollectionSharingService', () => {
  const prisma = {
    collectionShare: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    copy: {
      findMany: jest.fn(),
    },
  };
  let service: CollectionSharingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CollectionSharingService(prisma as never);
  });

  describe('createOrReuseShare', () => {
    it('creates a new token when no share exists, returning { token, expiresAt }', async () => {
      prisma.collectionShare.findUnique.mockResolvedValue(null);
      prisma.collectionShare.create.mockImplementation(({ data }) =>
        Promise.resolve({ ...data, revokedAt: null }),
      );

      const result = await service.createOrReuseShare(7, '1d');

      expect(prisma.collectionShare.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 7, duration: 'ONE_DAY' }),
        }),
      );
      expect(result.token).toEqual(expect.any(String));
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(Object.keys(result).sort()).toEqual(['expiresAt', 'token']);
    });

    it('maps every frontend expiresIn code to its ShareDuration enum value', async () => {
      const cases: Array<[string, string]> = [
        ['1h', 'ONE_HOUR'],
        ['1d', 'ONE_DAY'],
        ['7d', 'SEVEN_DAYS'],
        ['30d', 'THIRTY_DAYS'],
      ];

      for (const [expiresIn, duration] of cases) {
        jest.clearAllMocks();
        prisma.collectionShare.findUnique.mockResolvedValue(null);
        prisma.collectionShare.create.mockImplementation(({ data }) =>
          Promise.resolve({ ...data, revokedAt: null }),
        );

        await service.createOrReuseShare(7, expiresIn as never);

        expect(prisma.collectionShare.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ duration }),
          }),
        );
      }
    });

    it('reuses the active share instead of issuing a new token', async () => {
      const future = new Date(Date.now() + 60_000);
      prisma.collectionShare.findUnique.mockResolvedValue({
        token: 'existing-token',
        expiresAt: future,
        revokedAt: null,
      });

      const result = await service.createOrReuseShare(7, '1h');

      expect(prisma.collectionShare.create).not.toHaveBeenCalled();
      expect(prisma.collectionShare.update).not.toHaveBeenCalled();
      expect(result.token).toBe('existing-token');
    });

    it('issues a new token when the existing share expired', async () => {
      const past = new Date(Date.now() - 60_000);
      prisma.collectionShare.findUnique.mockResolvedValue({
        token: 'old-token',
        expiresAt: past,
        revokedAt: null,
      });
      prisma.collectionShare.update.mockImplementation(({ data }) =>
        Promise.resolve({ ...data, revokedAt: null }),
      );

      const result = await service.createOrReuseShare(7, '7d');

      expect(prisma.collectionShare.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 7 },
          data: expect.objectContaining({ duration: 'SEVEN_DAYS' }),
        }),
      );
      expect(result.token).not.toBe('old-token');
    });
  });

  describe('getOwnerShare', () => {
    it('returns null when no share exists', async () => {
      prisma.collectionShare.findUnique.mockResolvedValue(null);

      const result = await service.getOwnerShare(7);

      expect(result).toBeNull();
    });

    it('returns { token, expiresAt } when a share exists', async () => {
      prisma.collectionShare.findUnique.mockResolvedValue({
        token: 'tok',
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
      });

      const result = await service.getOwnerShare(7);

      expect(result).toEqual({
        token: 'tok',
        expiresAt: expect.any(Date),
      });
    });

    it('does not return a revoked share link', async () => {
      prisma.collectionShare.findUnique.mockResolvedValue({
        token: 'tok',
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: new Date(),
      });

      await expect(service.getOwnerShare(7)).resolves.toBeNull();
    });

    it('does not return an expired share link', async () => {
      prisma.collectionShare.findUnique.mockResolvedValue({
        token: 'tok',
        expiresAt: new Date(Date.now() - 60_000),
        revokedAt: null,
      });

      await expect(service.getOwnerShare(7)).resolves.toBeNull();
    });
  });

  describe('revokeShare', () => {
    it('throws when there is nothing to revoke', async () => {
      prisma.collectionShare.findUnique.mockResolvedValue(null);

      await expect(service.revokeShare(7)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('marks the share as revoked and returns { token, expiresAt }', async () => {
      prisma.collectionShare.findUnique.mockResolvedValue({
        token: 'tok',
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
      });
      prisma.collectionShare.update.mockResolvedValue({
        token: 'tok',
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: new Date(),
      });

      const result = await service.revokeShare(7);

      expect(prisma.collectionShare.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 7 },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
      expect(Object.keys(result).sort()).toEqual(['expiresAt', 'token']);
    });
  });

  describe('getSharedCollection', () => {
    it('rejects an unknown token generically', async () => {
      prisma.collectionShare.findUnique.mockResolvedValue(null);

      await expect(service.getSharedCollection('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects a revoked token generically', async () => {
      prisma.collectionShare.findUnique.mockResolvedValue({
        userId: 7,
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(service.getSharedCollection('revoked')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects an expired token generically', async () => {
      prisma.collectionShare.findUnique.mockResolvedValue({
        userId: 7,
        revokedAt: null,
        expiresAt: new Date(Date.now() - 60_000),
      });

      await expect(service.getSharedCollection('expired')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns { copies } with the explicit field selection matching the frontend contract, excluding copy title', async () => {
      prisma.collectionShare.findUnique.mockResolvedValue({
        userId: 7,
        user: { username: 'piratefan' },
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });
      prisma.copy.findMany.mockResolvedValue([
        {
          edition: 'DVD',
          volumes: [],
          includesBluRay: false,
          media: {
            id: 1,
            title: 'Sample',
            author: null,
            releaseYear: 2020,
            poster: null,
            category: 'MOVIE',
            mediaCollectionId: null,
            collectionPosition: null,
            mediaCollection: null,
          },
        },
      ]);

      const result = await service.getSharedCollection('valid');

      expect(prisma.copy.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 7, archivedAt: null },
          select: expect.objectContaining({
            edition: true,
            volumes: true,
            includesBluRay: true,
            media: expect.objectContaining({
              select: expect.objectContaining({
                id: true,
                title: true,
                author: true,
                releaseYear: true,
                poster: true,
                category: true,
                collectionPosition: true,
                mediaCollection: expect.objectContaining({
                  select: { id: true, title: true, category: true },
                }),
              }),
            }),
          }),
        }),
      );

      // Copy title is a user-entered personal value and must never be
      // selected or returned in the public share response.
      const [findManyArgs] = prisma.copy.findMany.mock.calls[0];
      expect(findManyArgs.select).not.toHaveProperty('title');

      expect(result).toEqual({
        ownerUsername: 'piratefan',
        copies: [
          expect.objectContaining({
            edition: 'DVD',
            media: expect.objectContaining({
              mediaKey: expect.any(String),
              title: 'Sample',
              mediaCollection: null,
            }),
          }),
        ],
      });
      expect(result.copies[0]).not.toHaveProperty('title');
      expect(result.copies[0].media).not.toHaveProperty('id');
      expect(result.copies[0].media).not.toHaveProperty('mediaCollectionId');
    });

    it('uses opaque per-response keys to deduplicate media and collection membership', async () => {
      prisma.collectionShare.findUnique.mockResolvedValue({
        userId: 7,
        user: { username: 'piratefan' },
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });
      const sameMedia = {
        id: 11,
        title: 'Part One',
        author: null,
        releaseYear: 2000,
        poster: null,
        category: 'MOVIE',
        collectionPosition: 1,
        mediaCollection: { id: 3, title: 'Series', category: 'MOVIE' },
      };
      prisma.copy.findMany.mockResolvedValue([
        { edition: 'DVD', volumes: [], includesBluRay: false, media: sameMedia },
        { edition: 'BLURAY', volumes: [], includesBluRay: false, media: sameMedia },
      ]);

      const { copies: sharedCopies } = await service.getSharedCollection('valid');

      expect(sharedCopies[0].media.mediaKey).toBe(sharedCopies[1].media.mediaKey);
      expect(sharedCopies[0].media.mediaCollection?.collectionKey).toBe(
        sharedCopies[1].media.mediaCollection?.collectionKey,
      );
      expect(sharedCopies[0].media).not.toHaveProperty('id');
      expect(sharedCopies[0].media.mediaCollection).not.toHaveProperty('id');
    });
  });
});
