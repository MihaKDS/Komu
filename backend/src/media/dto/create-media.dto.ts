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

  @IsString()
  description: string;

  @Type(() => Number)
  @IsInt()
  @Min(1888)
  @Max(new Date().getFullYear() + 5)
  releaseYear: number;

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
  movieCollection?: {
    tmdbId?: number;
    title?: string;
    poster?: string | null;
  };

  @IsOptional()
  importCollectionMembers?: boolean;
}
