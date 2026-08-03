import { TradeType } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTradeDto {
  @IsEnum(TradeType)
  type: TradeType;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Type(() => Number)
  copyIds: number[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}
