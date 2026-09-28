import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { UpdateMediaListDto } from './dto/update-media-list.dto';
import { ListsService } from './lists.service';

@UseGuards(JwtAuthGuard)
@Controller('lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Get('my')
  findMyLists(@Request() req) {
    return this.listsService.findByUser(req.user.id);
  }

  @Get('media/:mediaId')
  findByMedia(
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Request() req,
  ) {
    return this.listsService.findByMedia(mediaId, req.user.id);
  }

  @Put('media/:mediaId')
  upsert(
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Body() dto: UpdateMediaListDto,
    @Request() req,
  ) {
    return this.listsService.upsert(mediaId, req.user.id, dto);
  }

  @Delete('media/:mediaId')
  remove(
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Request() req,
  ) {
    return this.listsService.remove(mediaId, req.user.id);
  }
}
