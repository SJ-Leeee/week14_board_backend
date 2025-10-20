import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';
import { ValidMongoIdPipe } from 'src/common/pipes/valid-object-id.pipe';

@ApiTags('게시글')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '게시글 작성',
    description: '새로운 게시글을 작성합니다. (로그인 필요)',
  })
  @ApiResponse({ status: 201, description: '게시글 작성 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async create(
    @Body() createPostDto: CreatePostDto,
    @GetUser() user: UserDocument,
  ) {
    return this.postsService.create(createPostDto, user);
  }

  @Get()
  @ApiOperation({
    summary: '게시글 목록 조회',
    description: '게시글 목록을 페이지네이션하여 조회합니다.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지당 게시글 수',
    example: 10,
  })
  @ApiResponse({ status: 200, description: '게시글 목록 조회 성공' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.postsService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: '게시글 상세 조회',
    description: 'ID로 특정 게시글을 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '게시글 ID (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: '게시글 조회 성공' })
  @ApiResponse({ status: 404, description: '게시글을 찾을 수 없음' })
  @ApiResponse({ status: 400, description: '잘못된 ID 형식' })
  async findOne(@Param('id', ValidMongoIdPipe) id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '게시글 수정',
    description: '게시글을 수정합니다. (작성자만 가능)',
  })
  @ApiParam({
    name: 'id',
    description: '게시글 ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: '게시글 수정 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '수정 권한 없음' })
  @ApiResponse({ status: 404, description: '게시글을 찾을 수 없음' })
  async update(
    @Param('id', ValidMongoIdPipe) id: string,
    @Body() updatePostDto: UpdatePostDto,
    @GetUser() user: UserDocument,
  ) {
    const post = await this.postsService.update(id, updatePostDto, user);
    return {
      message: '게시글이 수정되었습니다.',
      post,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '게시글 삭제',
    description: '게시글을 삭제합니다. (작성자만 가능)',
  })
  @ApiParam({
    name: 'id',
    description: '게시글 ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: '게시글 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '삭제 권한 없음' })
  @ApiResponse({ status: 404, description: '게시글을 찾을 수 없음' })
  async remove(
    @Param('id', ValidMongoIdPipe) id: string,
    @GetUser() user: UserDocument,
  ) {
    await this.postsService.remove(id, user);
    return { message: '게시글이 삭제되었습니다.' };
  }
}
