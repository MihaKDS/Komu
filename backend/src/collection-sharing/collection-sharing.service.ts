import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes, randomUUID } from 'crypto';
import { ShareDuration } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { ExpiresIn } from './dto/create-collection-share.dto';

/**
 * Owner-facing view of a share record. Never exposes the userId or any
 * other account information - only what is needed to manage the link.
 */
export interface OwnerShareView {
  token: string;
  expiresAt: Date;
}

/**
 * Public collection payload returned for a valid share token.
 * Deliberately excludes copy ids, pricing/listing/trade/condition data,
 * BoxSet details, any user-entered copy title, and any user/account
 * information. Internal database ids (Media.id, MediaCollection.id) are
 * never exposed either - `mediaKey`/`collectionKey` are opaque,
 * per-response-only UUIDs used purely for frontend dedup/grouping and are
 * never persisted.
 */
export interface SharedCollectionCopy {
  edition: string;
  volumes: string[];
  includesBluRay: boolean;
  media: {
    mediaKey: string;
    title: string;
    author: string | null;
    releaseYear: number | null;
    poster: string | null;
    category: string;
    collectionPosition: number | null;
    mediaCollection: {
      collectionKey: string;
      title: string;
      category: string;
    } | null;
  };
}

// Maps the public API's frontend-facing duration codes to the internal
// Prisma enum used for persistence.
const EXPIRES_IN_TO_DURATION: Record<ExpiresIn, ShareDuration> = {
  '1h': 'ONE_HOUR',
  '1d': 'ONE_DAY',
  '7d': 'SEVEN_DAYS',
  '30d': 'THIRTY_DAYS',
};

const DURATION_MS: Record<ShareDuration, number> = {
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  SEVEN_DAYS: 7 * 24 * 60 * 60 * 1000,
  THIRTY_DAYS: 30 * 24 * 60 * 60 * 1000,
};

const SHARE_SELECT = {
  token: true,
  expiresAt: true,
  revokedAt: true,
};

@Injectable()
export class CollectionSharingService {
  constructor(private readonly prisma: PrismaService) {}

  private generateToken(): string {
    // 32 cryptographically random bytes, never derived from the user id.
    return randomBytes(32).toString('base64url');
  }

  private isActive(record: { revokedAt: Date | null; expiresAt: Date }): boolean {
    return !record.revokedAt && record.expiresAt > new Date();
  }

  private toOwnerView(record: {
    token: string;
    expiresAt: Date;
  }): OwnerShareView {
    return {
      token: record.token,
      expiresAt: record.expiresAt,
    };
  }

  /**
   * Returns the owner's current share record, or null if none exists.
   * Does not mutate state. Response shape: { token, expiresAt } | null.
   */
  async getOwnerShare(userId: number): Promise<OwnerShareView | null> {
    const existing = await this.prisma.collectionShare.findUnique({
      where: { userId },
      select: SHARE_SELECT,
    });

    return existing && this.isActive(existing)
      ? this.toOwnerView(existing)
      : null;
  }

  /**
   * Creates a new share link for the owner, or reuses the currently active
   * one if it hasn't expired or been revoked yet. Enforces one share
   * record per owner. Response shape: { token, expiresAt }.
   */
  async createOrReuseShare(
    userId: number,
    expiresIn: ExpiresIn,
  ): Promise<OwnerShareView> {
    const existing = await this.prisma.collectionShare.findUnique({
      where: { userId },
      select: SHARE_SELECT,
    });

    if (existing && this.isActive(existing)) {
      return this.toOwnerView(existing);
    }

    const duration = EXPIRES_IN_TO_DURATION[expiresIn];
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + DURATION_MS[duration]);

    const record = existing
      ? await this.prisma.collectionShare.update({
          where: { userId },
          data: { token, duration, expiresAt, revokedAt: null },
          select: SHARE_SELECT,
        })
      : await this.prisma.collectionShare.create({
          data: { userId, token, duration, expiresAt },
          select: SHARE_SELECT,
        });

    return this.toOwnerView(record);
  }

  /**
   * Revokes the owner's share link, if one exists.
   * Response shape: { token, expiresAt }.
   */
  async revokeShare(userId: number): Promise<OwnerShareView> {
    const existing = await this.prisma.collectionShare.findUnique({
      where: { userId },
      select: SHARE_SELECT,
    });

    if (!existing) {
      throw new NotFoundException('No collection share found');
    }

    const record = existing.revokedAt
      ? existing
      : await this.prisma.collectionShare.update({
          where: { userId },
          data: { revokedAt: new Date() },
          select: SHARE_SELECT,
        });

    return this.toOwnerView(record);
  }

  /**
   * Resolves a public share token to the owner's live collection data.
   * Absent, revoked and expired tokens are all rejected identically with a
   * generic NotFoundException so no information is leaked about which case
   * applies. Response shape: { copies: SharedCollectionCopy[] }.
   */
  async getSharedCollection(
    token: string,
  ): Promise<{ ownerUsername: string; copies: SharedCollectionCopy[] }> {
    const share = await this.prisma.collectionShare.findUnique({
      where: { token },
      select: {
        userId: true,
        revokedAt: true,
        expiresAt: true,
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!share || share.revokedAt || share.expiresAt <= new Date()) {
      throw new NotFoundException('Share not found');
    }

    const copies = await this.prisma.copy.findMany({
      where: {
        userId: share.userId,
        archivedAt: null,
      },
      select: {
        edition: true,
        volumes: true,
        includesBluRay: true,
        media: {
          select: {
            // ids are only used internally below to derive stable, opaque
            // per-response keys - they are stripped before the response
            // is returned and are never persisted.
            id: true,
            title: true,
            author: true,
            releaseYear: true,
            poster: true,
            category: true,
            collectionPosition: true,
            mediaCollection: {
              select: {
                id: true,
                title: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: [
        { media: { collectionPosition: 'asc' } },
        { media: { title: 'asc' } },
      ],
    });

    // Ephemeral, per-response-only id -> key maps so the same media/
    // collection is assigned the same opaque key across multiple copies
    // within this single response (for frontend dedup/grouping), without
    // ever exposing or persisting the underlying database ids.
    const mediaKeys = new Map<number, string>();
    const collectionKeys = new Map<number, string>();

    const keyFor = (map: Map<number, string>, id: number): string => {
      let key = map.get(id);
      if (!key) {
        key = randomUUID();
        map.set(id, key);
      }
      return key;
    };

    const result: SharedCollectionCopy[] = copies.map((copy) => ({
      edition: copy.edition,
      volumes: copy.volumes,
      includesBluRay: copy.includesBluRay,
      media: {
        mediaKey: keyFor(mediaKeys, copy.media.id),
        title: copy.media.title,
        author: copy.media.author,
        releaseYear: copy.media.releaseYear,
        poster: copy.media.poster,
        category: copy.media.category,
        collectionPosition: copy.media.collectionPosition,
        mediaCollection: copy.media.mediaCollection
          ? {
              collectionKey: keyFor(
                collectionKeys,
                copy.media.mediaCollection.id,
              ),
              title: copy.media.mediaCollection.title,
              category: copy.media.mediaCollection.category,
            }
          : null,
      },
    }));

    return {
      ownerUsername: share.user.username,
      copies: result,
    };
  }
}