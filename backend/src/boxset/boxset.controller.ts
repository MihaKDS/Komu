import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { BoxSetService } from './boxset.service';
import { AddBoxSetMediaDto } from './dto/add-boxset-media.dto';

@Controller('boxsets')
export class BoxSetController {
  constructor(private readonly boxSetService: BoxSetService) {}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.boxSetService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/media')
  addMedia(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddBoxSetMediaDto,
    @Request() req,
  ) {
    return this.boxSetService.addMedia(id, dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/media/:mediaId')
  removeMedia(
    @Param('id', ParseIntPipe) id: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Request() req,
  ) {
    return this.boxSetService.removeMedia(id, mediaId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.boxSetService.remove(id, req.user.id);
  }
}
