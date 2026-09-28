import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { CollectionShareController } from './collection-share.controller';
import { PublicShareController } from './public-share.controller';
import { CollectionSharingService } from './collection-sharing.service';

@Module({
  imports: [PrismaModule],
  controllers: [CollectionShareController, PublicShareController],
  providers: [CollectionSharingService],
  exports: [CollectionSharingService],
})
export class CollectionSharingModule {}