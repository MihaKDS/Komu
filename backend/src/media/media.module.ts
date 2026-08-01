import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CopyModule } from '../copy/copy.module';
import { TmdbModule } from '../tmdb/tmdb.module';

@Module({
  imports: [
    PrismaModule,
    CopyModule,
    TmdbModule,
  ],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}