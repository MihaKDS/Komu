import { IsIn } from 'class-validator';

export type ExpiresIn = '1h' | '1d' | '7d' | '30d';

export const EXPIRES_IN_VALUES: ExpiresIn[] = ['1h', '1d', '7d', '30d'];

export class CreateCollectionShareDto {
  @IsIn(EXPIRES_IN_VALUES)
  expiresIn: ExpiresIn;
}