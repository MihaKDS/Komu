import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class TradeItemSelectionDto {
  @IsInt()
  @Type(() => Number)
  tradeItemId: number;

  @IsBoolean()
  sellerAccepted: boolean;
}

export class UpdateTradeItemsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TradeItemSelectionDto)
  items: TradeItemSelectionDto[];
}