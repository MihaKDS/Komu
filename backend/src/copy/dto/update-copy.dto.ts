import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCopyDto {

  @IsBoolean()
  canSell: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  listingNote?: string;

  @IsOptional()
  @IsNumber()
  sellPrice?: number;

  @IsBoolean()
  canRent: boolean;

  @IsOptional()
  @IsNumber()
  rentPrice?: number;

  @IsOptional()
  @IsNumber()
  deposit?: number;
}