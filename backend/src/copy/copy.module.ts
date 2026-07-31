import { Module } from '@nestjs/common';
import { CopyController } from './copy.controller';
import { CopyService } from './copy.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CopyController],
  providers: [CopyService],
  exports: [CopyService],
})
export class CopyModule {}