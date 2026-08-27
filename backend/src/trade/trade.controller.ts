import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { TradeService } from './trade.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { CreateTradeMessageDto } from './dto/create-trade-message.dto';
import { UpdateTradeItemsDto } from './dto/update-trade-items.dto';
import { CompleteTradeDto } from './dto/complete-trade.dto';

@UseGuards(JwtAuthGuard)
@Controller('trades')
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  @Post()
  create(@Body() dto: CreateTradeDto, @Request() req) {
    return this.tradeService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Request() req) {
    return this.tradeService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.tradeService.findOne(id, req.user.id);
  }

  @Post(':id/messages')
  addMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTradeMessageDto,
    @Request() req,
  ) {
    return this.tradeService.addMessage(id, dto, req.user.id);
  }

  @Post(':id/accept')
  accept(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.tradeService.accept(id, req.user.id);
  }

  @Post(':id/reject')
  reject(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.tradeService.reject(id, req.user.id);
  }

  @Post(':id/cancel')
cancel(
  @Param('id', ParseIntPipe) id: number,
  @Request() req,
) {
  return this.tradeService.cancelByBuyer(
    id,
    req.user.id,
  );
}
@Post(':id/decline-transfer')
declineTransfer(
  @Param('id', ParseIntPipe) id: number,
  @Request() req,
) {
  return this.tradeService.declineTransfer(
    id,
    req.user.id,
  );
}

  @Post(':id/buyer-transfer')
  confirmBuyerTransfer(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.tradeService.confirmBuyerTransfer(id, req.user.id);
  }

  @Post(':id/return-request')
  requestReturn(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.tradeService.requestReturn(id, req.user.id);
  }

  @Post(':id/accept-return')
  acceptReturn(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.tradeService.acceptReturn(id, req.user.id);
  }

  @Patch(':id/items')
updateItems(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: UpdateTradeItemsDto,
  @Request() req,
) {
  return this.tradeService.updateItems(
    id,
    dto,
    req.user.id,
  );
}
@Post(':id/complete')
complete(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: CompleteTradeDto,
  @Request() req,
) {
  return this.tradeService.complete(
    id,
    dto,
    req.user.id,
  );
}
}
