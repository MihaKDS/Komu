import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { Category } from '@prisma/client';


export class UpdateMediaCollectionInfoDto {

  @IsString()
  title: string;


  @IsEnum(Category)
  category: Category;


  @IsOptional()
  @IsString()
  poster?: string | null;


  @IsOptional()
  @IsInt()
  @Min(1)
  tmdbId?: number | null;


  @IsOptional()
  @IsString()
  overview?: string | null;

}