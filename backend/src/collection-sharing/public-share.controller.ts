import { Controller, Get, Param } from '@nestjs/common';

import { CollectionSharingService } from './collection-sharing.service';

// Public, unauthenticated endpoint used to view a shared collection via
// its token. Invalid, revoked and expired tokens are rejected identically.
@Controller('share')
export class PublicShareController {
  constructor(private readonly sharingService: CollectionSharingService) {}

  @Get(':token')
  getSharedCollection(@Param('token') token: string) {
    return this.sharingService.getSharedCollection(token);
  }
}