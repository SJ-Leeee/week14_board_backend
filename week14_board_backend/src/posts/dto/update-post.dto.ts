import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiPropertyOptional({
    description: '게시글 제목',
    example: '수정된 게시글 제목',
    minLength: 1,
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional({
    description: '게시글 내용',
    example: '수정된 게시글 내용입니다.',
    minLength: 1,
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  content?: string;
}
