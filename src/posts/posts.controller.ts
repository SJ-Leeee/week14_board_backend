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
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';
import { ValidMongoIdPipe } from 'src/common/pipes/valid-object-id.pipe';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  // jwt로 유저검증
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createPostDto: CreatePostDto,
    // 가드로 넘어온 유저객체
    @GetUser() user: UserDocument,
  ) {
    return this.postsService.create(createPostDto, user);
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.postsService.findAll(page, limit);
  }

  @Get(':id')
  // ObjectId인지 검증
  async findOne(@Param('id', ValidMongoIdPipe) id: string) {
    return this.postsService.findOne(id);
  }
  //

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
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
  async remove(@Param('id') id: string, @GetUser() user: UserDocument) {
    await this.postsService.remove(id, user);
    return { message: '게시글이 삭제되었습니다.' };
  }
}
