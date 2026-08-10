import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateMediaCollectionDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsUrl()
  poster?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tmdbId?: number;
}
