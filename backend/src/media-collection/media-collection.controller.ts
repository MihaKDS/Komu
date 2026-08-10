import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { CreateMediaCollectionDto } from './dto/create-media-collection.dto';
import { MediaCollectionService } from './media-collection.service';

@Controller('collections')
export class MediaCollectionController {
  constructor(private readonly mediaCollectionService: MediaCollectionService) {}

  @Get('search')
  search(@Query('query') query: string) {
    return this.mediaCollectionService.search(query);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateMediaCollectionDto) {
    return this.mediaCollectionService.create(dto);
  }
}
