import { Controller, Get, Param, Query } from '@nestjs/common';

import { GoogleBooksService } from './google-books.service';

@Controller('google-books')
export class GoogleBooksController {

  constructor(
    private readonly googleBooksService: GoogleBooksService,
  ) {}

  @Get('search')
  search(@Query('query') query: string) {
    return this.googleBooksService.searchBooks(query);
  }

  @Get(':id')
  getBookDetails(@Param('id') id: string) {
    return this.googleBooksService.getBookDetails(id);
  }
}