import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { BoxSetService } from './boxset.service';
import { AddBoxSetMediaDto } from './dto/add-boxset-media.dto';
import { UpdateBoxSetDto } from './dto/update-boxset.dto';

@Controller('boxsets')
export class BoxSetController {
  constructor(private readonly boxSetService: BoxSetService) {}

  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyBoxSets(@Request() req) {
    return this.boxSetService.findByUser(req.user.id);
  }

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

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBoxSetDto,
    @Request() req,
  ) {
    return this.boxSetService.update(id, dto, req.user.id);
  }
}
