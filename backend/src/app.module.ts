import { Module } from '@nestjs/common';
import { GoogleBooksModule } from './googleBooks/google-books.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MediaModule } from './media/media.module';
import { PrismaModule } from './prisma/prisma.module';
import { CopyModule } from './copy/copy.module';
import { AuthModule } from './auth/auth.module';
import { TmdbModule } from './tmdb/tmdb.module';
import { BoxSetModule } from './boxset/boxset.module';
import { TradeModule } from './trade/trade.module';
import { MediaCollectionModule } from './media-collection/media-collection.module';
import { ListsModule } from './lists/lists.module';
import { CollectionSharingModule } from './collection-sharing/collection-sharing.module';

@Module({
  imports: [MediaModule, PrismaModule, CopyModule, AuthModule, TmdbModule, BoxSetModule, TradeModule, MediaCollectionModule, GoogleBooksModule, ListsModule, CollectionSharingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
