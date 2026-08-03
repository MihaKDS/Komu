import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MediaModule } from './media/media.module';
import { PrismaModule } from './prisma/prisma.module';
import { CopyModule } from './copy/copy.module';
import { AuthModule } from './auth/auth.module';
import { TmdbModule } from './tmdb/tmdb.module';
import { BoxSetModule } from './boxset/boxset.module';
import { TradeModule } from './trade/trade.module';

@Module({
  imports: [MediaModule, PrismaModule, CopyModule, AuthModule, TmdbModule, BoxSetModule, TradeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
