import { Module } from '@nestjs/common';
import { BoxSetController } from './boxset.controller';
import { BoxSetService } from './boxset.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BoxSetController],
  providers: [BoxSetService],
  exports: [BoxSetService],
})
export class BoxSetModule {}
