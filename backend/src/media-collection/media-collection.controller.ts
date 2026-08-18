import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';

import { UpdateMediaCollectionMediaDto } from './dto/update-media-collection.dto';
import { UpdateMediaCollectionInfoDto } from './dto/update-media-collection-info.dto';
import { CreateMediaCollectionDto } from './dto/create-media-collection.dto';

import { MediaCollectionService } from './media-collection.service';


@Controller('collections')
export class MediaCollectionController {

  constructor(
    private readonly mediaCollectionService: MediaCollectionService,
  ) {}


  @Get('search')
  search(@Query('query') query: string) {
    return this.mediaCollectionService.search(query);
  }


  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateMediaCollectionDto) {
    return this.mediaCollectionService.create(dto);
  }


  // Update collection information
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMediaCollectionInfoDto,
  ) {
    return this.mediaCollectionService.update(
      id,
      dto,
    );
  }


  // Update collection media/order
  @UseGuards(JwtAuthGuard)
  @Patch(':id/media')
  updateMedia(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMediaCollectionMediaDto,
  ) {
    return this.mediaCollectionService.updateMedia(
      id,
      dto,
    );
  }


  // Delete collection
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.mediaCollectionService.remove(
      id,
    );
  }

}