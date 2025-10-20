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
import { ApiTags } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';
import { ValidMongoIdPipe } from 'src/common/pipes/valid-object-id.pipe';
import {
  ApiCreatePost,
  ApiUpdatePost,
  ApiDeletePost,
  ApiGetPost,
  ApiGetAllPosts,
} from '../common/decorators/swagger.decorator';

@ApiTags('게시글')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCreatePost()
  async create(
    @Body() createPostDto: CreatePostDto,
    @GetUser() user: UserDocument,
  ) {
    return this.postsService.create(createPostDto, user);
  }

  @Get()
  @ApiGetAllPosts()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.postsService.findAll(page, limit);
  }

  @Get(':id')
  @ApiGetPost()
  async findOne(@Param('id', ValidMongoIdPipe) id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiUpdatePost()
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
  @ApiDeletePost()
  async remove(
    @Param('id', ValidMongoIdPipe) id: string,
    @GetUser() user: UserDocument,
  ) {
    await this.postsService.remove(id, user);
    return { message: '게시글이 삭제되었습니다.' };
  }
}
