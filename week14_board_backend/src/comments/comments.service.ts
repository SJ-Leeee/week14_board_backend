import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { PostsService } from '../posts/posts.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    private postsService: PostsService,
  ) {}

  async create(
    postId: string,
    createCommentDto: CreateCommentDto,
    user: UserDocument,
  ): Promise<CommentDocument> {
    // 게시글 존재 확인
    await this.postsService.findOne(postId);

    const newComment = new this.commentModel({
      ...createCommentDto,
      author: user._id,
      post: postId,
    });

    const savedComment = await newComment.save();
    return savedComment.populate('author', 'username email');
  }

  async findAllByPost(postId: string): Promise<CommentDocument[]> {
    // 게시글 존재 확인
    await this.postsService.findOne(postId);

    return this.commentModel
      .find({ post: postId })
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .exec();
  }
}
