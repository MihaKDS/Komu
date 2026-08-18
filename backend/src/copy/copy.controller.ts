import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Delete,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { CopyService } from './copy.service';
import { CreateCopyDto } from './dto/create-copy.dto';
import { UpdateCopyDto } from './dto/update-copy.dto';
import { BulkCopyDto } from './dto/bulk-copy.dto';

@Controller('copies')
export class CopyController {
  constructor(private readonly copyService: CopyService) {}

  // Public
  @Get('media/:id')
  findByMediaId(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.copyService.findByMediaId(id);
  }

  // Logged-in user's collection
  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyCopies(@Request() req) {
    return this.copyService.findByUser(req.user.id);
  }

  // Logged-in user's copy
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.copyService.findOne(id, req.user.id);
  }

  // Add copy
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() dto: CreateCopyDto,
    @Request() req,
  ) {
    return this.copyService.create(dto, req.user.id);
  }

    // Bulk collection actions
  @UseGuards(JwtAuthGuard)
  @Patch('bulk')
  bulkUpdate(
    @Body() dto: BulkCopyDto,
    @Request() req,
  ) {
    return this.copyService.bulkUpdate(
      dto,
      req.user.id,
    );
  }

  // Update copy
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCopyDto,
    @Request() req,
  ) {
    return this.copyService.update(id, dto, req.user.id);
  }

  // Delete copy
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.copyService.remove(id, req.user.id);
  }

  // Split copy
  @UseGuards(JwtAuthGuard)
  @Post(':id/split')
  split(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.copyService.split(id, req.user.id);
  }
  
}