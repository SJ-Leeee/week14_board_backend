import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  async create(
    createPostDto: CreatePostDto,
    user: UserDocument,
  ): Promise<PostDocument> {
    const newPost = new this.postModel({
      ...createPostDto,
      author: user._id,
    });
    const savedPost = await newPost.save();
    // 포스트와 함께 유저네임과 이메일을 같이반환
    return savedPost.populate('author', 'username email');
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 50); // 최대 50개로 제한

    const [posts, total] = await Promise.all([
      this.postModel
        .find()
        .populate('author', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(maxLimit)
        .exec(),
      this.postModel.countDocuments().exec(),
    ]);

    return {
      page,
      limit: maxLimit,
      total,
      posts,
    };
  }

  async findOne(id: string): Promise<PostDocument> {
    const post = await this.postModel
      .findById(id)
      .populate('author', 'username email')
      .exec();

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    return post;
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    user: UserDocument,
  ): Promise<PostDocument> {
    const post = await this.postModel.findById(id).exec();

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    // 작성자 확인
    if (post.author.toString() !== user._id.toString()) {
      throw new ForbiddenException('게시글 수정 권한이 없습니다.');
    }

    Object.assign(post, updatePostDto);
    post.updatedAt = new Date();
    const updatedPost = await post.save();

    return updatedPost.populate('author', 'username email');
  }

  async remove(id: string, user: UserDocument): Promise<void> {
    const post = await this.postModel.findById(id).exec();

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    // 작성자 확인
    if (post.author.toString() !== user._id.toString()) {
      throw new ForbiddenException('게시글 삭제 권한이 없습니다.');
    }

    await this.postModel.findByIdAndDelete(id).exec();
  }
}
