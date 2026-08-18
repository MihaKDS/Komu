import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export enum BulkCopyAction {
  SET_PRICE = 'SET_PRICE',
  REMOVE_FROM_SALE = 'REMOVE_FROM_SALE',
  DELETE = 'DELETE',
}

export class BulkCopyDto {
  @IsArray()
  @IsInt({ each: true })
  copyIds: number[];

  @IsEnum(BulkCopyAction)
  action: BulkCopyAction;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sellPrice?: number;
}