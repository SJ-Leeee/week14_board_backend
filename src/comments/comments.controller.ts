import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';

@ApiTags('댓글')
@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '댓글 작성', description: '게시글에 댓글을 작성합니다. (로그인 필요)' })
  @ApiParam({ name: 'postId', description: '게시글 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 201, description: '댓글 작성 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '게시글을 찾을 수 없음' })
  async create(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @GetUser() user: UserDocument,
  ) {
    return this.commentsService.create(postId, createCommentDto, user);
  }

  @Get()
  @ApiOperation({ summary: '댓글 목록 조회', description: '특정 게시글의 모든 댓글을 조회합니다.' })
  @ApiParam({ name: 'postId', description: '게시글 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: '댓글 목록 조회 성공' })
  @ApiResponse({ status: 404, description: '게시글을 찾을 수 없음' })
  async findAll(@Param('postId') postId: string) {
    return this.commentsService.findAllByPost(postId);
  }
}
