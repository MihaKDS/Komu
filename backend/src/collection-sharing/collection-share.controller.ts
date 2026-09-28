import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { CollectionSharingService } from './collection-sharing.service';
import { CreateCollectionShareDto } from './dto/create-collection-share.dto';

// Authenticated owner-facing endpoints for managing the caller's own
// collection share link. Never returns user/account information - only
// the token, its expiry and whether it is currently active.
@UseGuards(JwtAuthGuard)
@Controller('collection/share')
export class CollectionShareController {
  constructor(private readonly sharingService: CollectionSharingService) {}

  @Get()
  async getShare(@Request() req) {
    return {
      share: await this.sharingService.getOwnerShare(req.user.id),
    };
  }

  @Post()
  createShare(@Body() dto: CreateCollectionShareDto, @Request() req) {
    return this.sharingService.createOrReuseShare(req.user.id, dto.expiresIn);
  }

  @Delete()
  revokeShare(@Request() req) {
    return this.sharingService.revokeShare(req.user.id);
  }
}