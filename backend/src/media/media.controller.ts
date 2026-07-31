import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { CopyService } from '../copy/copy.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { CreateMediaDto } from './dto/create-media.dto';
import { Body, Post } from '@nestjs/common';

@Controller('media')
export class MediaController {

  constructor(
    private readonly mediaService: MediaService,
    private readonly copyService: CopyService,
  ) {}

  @Get()
  findAll() {
    return this.mediaService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateMediaDto) {
    return this.mediaService.create(dto);
  }

  @Get('search')
  search(@Query('query') query: string) {
    return this.mediaService.search(query);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    console.log("controller:", req.user);
    return this.mediaService.findOne(id, req.user?.id);
  }

  @Get(':id/copies')
  findCopies(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.copyService.findByMediaId(id);
  }

}
