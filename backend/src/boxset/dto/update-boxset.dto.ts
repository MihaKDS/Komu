import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBoxSetDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  listingNote?: string;

  @IsOptional()
  @IsBoolean()
  canSell?: boolean;

  @IsOptional()
  @IsNumber()
  sellPrice?: number | null;

  @IsOptional()
  @IsBoolean()
  canRent?: boolean;

  @IsOptional()
  @IsNumber()
  rentPrice?: number | null;

  @IsOptional()
  @IsNumber()
  deposit?: number | null;
}
