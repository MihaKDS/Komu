import { Edition } from "@prisma/client";
import { IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";
import { Type } from "class-transformer";

export class CreateCopyDto {
  @IsEnum(Edition)
  edition: Edition;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  listingNote?: string;

  @IsBoolean()
  includesBluRay: boolean;

  @IsBoolean()
  partOfBox: boolean;

  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  mediaIds: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  volumes: number[];

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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  existingBoxSetId?: number;
}