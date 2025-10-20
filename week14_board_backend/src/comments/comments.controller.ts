import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';
import {
  ApiCreateComment,
  ApiGetComments,
} from '../common/decorators/swagger.decorator';

@ApiTags('댓글')
@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCreateComment()
  async create(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @GetUser() user: UserDocument,
  ) {
    return this.commentsService.create(postId, createCommentDto, user);
  }

  @Get()
  @ApiGetComments()
  async findAll(@Param('postId') postId: string) {
    return this.commentsService.findAllByPost(postId);
  }
}
