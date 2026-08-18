import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { Category } from '@prisma/client';


export class UpdateMediaDto {

  @IsOptional()
  @IsString()
  title?: string;


  @IsOptional()
  @IsString()
  author?: string | null;


  @IsOptional()
  @IsString()
  description?: string | null;


  @IsOptional()
  @IsInt()
  @Min(1)
  releaseYear?: number | null;


  @IsOptional()
  @IsString()
  poster?: string | null;


  @IsOptional()
  @IsEnum(Category)
  category?: Category;


  @IsOptional()
  @IsInt()
  @Min(1)
  tmdbId?: number | null;
}