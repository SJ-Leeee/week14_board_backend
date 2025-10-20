import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignUpDto {
  @IsString()
  @MinLength(2)
  // 2글자 이상 이름
  username: string;

  @IsEmail()
  // 이메일인지 확인
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
