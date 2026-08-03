import { IsString, MaxLength } from 'class-validator';

export class CreateTradeMessageDto {
  @IsString()
  @MaxLength(1000)
  message: string;
}
