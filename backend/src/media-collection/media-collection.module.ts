import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MediaCollectionController } from './media-collection.controller';
import { MediaCollectionService } from './media-collection.service';

@Module({
  imports: [PrismaModule],
  controllers: [MediaCollectionController],
  providers: [MediaCollectionService],
})
export class MediaCollectionModule {}
