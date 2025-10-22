import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CommentsService } from './comments.service';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PostsService } from '../posts/posts.service';
import { NotFoundException } from '@nestjs/common';

describe('CommentsService', () => {
  let service: CommentsService;
  let postsService: PostsService;

  // Mock 사용자 데이터
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    email: 'test@example.com',
  };

  // Mock 게시글 데이터
  const mockPost = {
    _id: '507f1f77bcf86cd799439020',
    title: 'Test Post',
    content: 'Test Content',
    author: mockUser._id,
  };

  // Mock 댓글 데이터
  const mockComment = {
    _id: '507f1f77bcf86cd799439030',
    content: 'This is a test comment',
    author: mockUser._id,
    post: mockPost._id,
    createdAt: new Date(),
  };

  /**
   * Mock CommentModel - mockReturnThis() 패턴 사용
   * 체이닝 메서드들은 자기 자신을 반환하여 체이닝 가능하게 함
   */
  const mockCommentModel = {
    find: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    save: jest.fn(),
  };

  /**
   * Mock PostsService
   * - findOne 메서드만 필요
   */
  const mockPostsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: getModelToken(Comment.name),
          useValue: mockCommentModel,
        },
        {
          provide: PostsService,
          useValue: mockPostsService,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    postsService = module.get<PostsService>(PostsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('새로운 댓글을 생성해야 함', async () => {
      const postId = '507f1f77bcf86cd799439020';
      const createCommentDto: CreateCommentDto = {
        content: 'This is a new comment',
      };

      /**
       * 1. postsService.findOne 모킹 (게시글 존재 확인)
       */
      mockPostsService.findOne.mockResolvedValue(mockPost);

      /**
       * 2. populate() 메서드 모킹
       */
      const mockPopulate = jest.fn().mockResolvedValue({
        ...mockComment,
        author: mockUser,
      });

      /**
       * 3. save() 메서드 모킹
       * - save()가 populate 메서드를 가진 객체를 반환
       */
      const mockSave = jest.fn().mockResolvedValue({
        ...mockComment,
        populate: mockPopulate,
      });

      /**
       * 4. Mongoose 모델 인스턴스 모킹
       */
      const mockCommentInstance = {
        save: mockSave,
      };

      /**
       * 5. 생성자 함수 모킹
       */
      const mockConstructor = jest
        .fn()
        .mockImplementation(() => mockCommentInstance);

      service = new CommentsService(mockConstructor as any, postsService);

      /**
       * 6. create 메서드 실행
       */
      const result = await service.create(
        postId,
        createCommentDto,
        mockUser as any,
      );

      /**
       * 7. 검증
       */
      // postsService.findOne이 올바른 postId로 호출되었는지 확인
      expect(mockPostsService.findOne).toHaveBeenCalledWith(postId);

      // 생성자가 올바른 파라미터로 호출되었는지 확인
      expect(mockConstructor).toHaveBeenCalledWith({
        ...createCommentDto,
        author: mockUser._id,
        post: postId,
      });

      // save가 호출되었는지 확인
      expect(mockSave).toHaveBeenCalled();

      // populate이 올바른 파라미터로 호출되었는지 확인
      expect(mockPopulate).toHaveBeenCalledWith('author', 'username email');

      // 결과 확인
      expect(result).toEqual({
        ...mockComment,
        author: mockUser,
      });
    });

    it('게시글이 존재하지 않으면 NotFoundException을 던져야 함', async () => {
      const postId = 'nonexistentpost';
      const createCommentDto: CreateCommentDto = {
        content: 'This is a comment',
      };

      /**
       * postsService.findOne이 NotFoundException을 던지도록 모킹
       */
      mockPostsService.findOne.mockRejectedValue(
        new NotFoundException('게시글을 찾을 수 없습니다.'),
      );

      await expect(
        service.create(postId, createCommentDto, mockUser as any),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.create(postId, createCommentDto, mockUser as any),
      ).rejects.toThrow('게시글을 찾을 수 없습니다.');
    });
  });

  describe('findAllByPost', () => {
    it('특정 게시글의 모든 댓글을 반환해야 함', async () => {
      const postId = '507f1f77bcf86cd799439020';
      const mockComments = [mockComment];

      /**
       * 1. postsService.findOne 모킹
       */
      mockPostsService.findOne.mockResolvedValue(mockPost);

      /**
       * 2. find() 체이닝 모킹 - mockReturnThis() 패턴
       * find().populate().sort().exec()
       */
      mockCommentModel.find.mockReturnThis();
      mockCommentModel.populate.mockReturnThis();
      mockCommentModel.sort.mockReturnThis();
      mockCommentModel.exec.mockResolvedValue(mockComments);

      const result = await service.findAllByPost(postId);

      /**
       * 3. 검증
       */
      // postsService.findOne이 올바른 postId로 호출되었는지 확인
      expect(mockPostsService.findOne).toHaveBeenCalledWith(postId);

      // find가 올바른 쿼리로 호출되었는지 확인
      expect(mockCommentModel.find).toHaveBeenCalledWith({ post: postId });

      // populate이 올바른 파라미터로 호출되었는지 확인
      expect(mockCommentModel.populate).toHaveBeenCalledWith(
        'author',
        'username',
      );

      // sort가 올바른 파라미터로 호출되었는지 확인
      expect(mockCommentModel.sort).toHaveBeenCalledWith({ createdAt: -1 });

      // exec가 호출되었는지 확인
      expect(mockCommentModel.exec).toHaveBeenCalled();

      // 결과 확인
      expect(result).toEqual(mockComments);
    });

    it('게시글이 존재하지 않으면 NotFoundException을 던져야 함', async () => {
      const postId = 'nonexistentpost';

      /**
       * postsService.findOne이 NotFoundException을 던지도록 모킹
       */
      mockPostsService.findOne.mockRejectedValue(
        new NotFoundException('게시글을 찾을 수 없습니다.'),
      );

      await expect(service.findAllByPost(postId)).rejects.toThrow(
        NotFoundException,
      );

      await expect(service.findAllByPost(postId)).rejects.toThrow(
        '게시글을 찾을 수 없습니다.',
      );
    });

    it('댓글이 없는 게시글의 경우 빈 배열을 반환해야 함', async () => {
      const postId = '507f1f77bcf86cd799439020';

      /**
       * 1. postsService.findOne 모킹
       */
      mockPostsService.findOne.mockResolvedValue(mockPost);

      /**
       * 2. find() 체이닝 모킹 - 빈 배열 반환
       */
      mockCommentModel.find.mockReturnThis();
      mockCommentModel.populate.mockReturnThis();
      mockCommentModel.sort.mockReturnThis();
      mockCommentModel.exec.mockResolvedValue([]);

      const result = await service.findAllByPost(postId);

      // 결과가 빈 배열인지 확인
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
});
