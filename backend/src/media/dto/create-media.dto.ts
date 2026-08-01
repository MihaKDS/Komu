import { Category } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';

export class CreateMediaDto {
  @IsString()
  title: string;

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

  @IsEnum(Category)
  category: Category;

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

