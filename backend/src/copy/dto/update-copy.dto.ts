import { Condition } from '@prisma/client';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCopyDto {

  @IsBoolean()
  canSell: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  listingNote?: string;

  @IsOptional()
  @IsEnum(Condition)
  condition?: Condition;

  @IsOptional()
  @IsNumber()
  sellPrice?: number;

  @IsBoolean()
  canRent: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  boxSetName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  boxSetListingNote?: string;

  @IsOptional()
  @IsBoolean()
  boxSetCanSell?: boolean;

  @IsOptional()
  @IsNumber()
  boxSetSellPrice?: number;

  @IsOptional()
  @IsBoolean()
  boxSetCanRent?: boolean;
}