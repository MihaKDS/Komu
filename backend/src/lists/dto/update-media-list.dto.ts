import { ListStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateMediaListDto {
  @IsEnum(ListStatus)
  status: ListStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  progress?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}
