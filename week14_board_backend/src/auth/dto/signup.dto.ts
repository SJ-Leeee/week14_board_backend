import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({
    description: '사용자 이름',
    example: 'john_doe',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  username: string;

  @ApiProperty({
    description: '이메일 주소',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: '비밀번호',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}
