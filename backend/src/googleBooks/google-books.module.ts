import { Module } from '@nestjs/common';

import { GoogleBooksController } from './google-books.controller';
import { GoogleBooksService } from './google-books.service';

@Module({
  controllers: [GoogleBooksController],
  providers: [GoogleBooksService],
  exports: [GoogleBooksService],
})
export class GoogleBooksModule {}