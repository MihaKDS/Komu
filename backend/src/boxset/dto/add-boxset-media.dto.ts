import { Type } from 'class-transformer';
import { Edition } from '@prisma/client';
import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt } from 'class-validator';

export class AddBoxSetMediaDto {
  @IsEnum(Edition)
  edition: Edition;

  @IsBoolean()
  includesBluRay: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Type(() => Number)
  mediaIds: number[];
}
