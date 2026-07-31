import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class RegisterDto {

  @IsString()
  @Length(3, 20)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 100)
  password: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  city?: string;

}