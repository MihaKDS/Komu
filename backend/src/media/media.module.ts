import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CopyModule } from '../copy/copy.module';

@Module({
  imports: [
    PrismaModule,
    CopyModule,
  ],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}