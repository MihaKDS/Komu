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

  @IsEnum(Category)
  category: Category;
}
