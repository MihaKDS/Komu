import { Edition } from "@prisma/client";
import { IsArray, IsBoolean, IsEnum, IsInt } from "class-validator";
import { Type } from "class-transformer";

export class CreateCopyDto {
  @IsEnum(Edition)
  edition: Edition;

  @IsBoolean()
  includesBluRay: boolean;

  @IsBoolean()
  partOfBox: boolean;

  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  mediaIds: number[];
}