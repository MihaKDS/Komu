import { IsBoolean } from 'class-validator';

export class CompleteTradeDto {
  @IsBoolean()
  transferCopies: boolean;
}