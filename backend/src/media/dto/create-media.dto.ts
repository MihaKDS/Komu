import { Category } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';

export class CreateMediaDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  author?: string;

  @IsOptional()
  @IsString()
  description: string;

@IsOptional()
@Type(() => Number)
@IsInt()
@Min(1)
@Max(9999)
releaseYear?: number | null;

  @IsOptional()
  @IsUrl()
  poster?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tmdbId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  collectionPosition?: number;

  @IsEnum(Category)
  category: Category;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  collectionId?: number;

  // Optional collection info when creating from TMDb
  @IsOptional()
  MediaCollection?: {
    tmdbId?: number;
    title?: string;
    poster?: string | null;
  };

  @IsOptional()
  importCollectionMembers?: boolean;
}
