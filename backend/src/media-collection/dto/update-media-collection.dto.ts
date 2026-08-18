import {
  IsArray,
  IsInt,
  ArrayUnique,
} from 'class-validator';

import {
  Type,
} from 'class-transformer';


export class UpdateMediaCollectionMediaDto {

  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Type(() => Number)
  mediaIds: number[];

}