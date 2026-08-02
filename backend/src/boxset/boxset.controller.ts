import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { BoxSetService } from './boxset.service';

@Controller('boxsets')
export class BoxSetController {
  constructor(private readonly boxSetService: BoxSetService) {}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.boxSetService.findOne(id);
  }
}
