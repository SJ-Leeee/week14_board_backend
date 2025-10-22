import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PostsService } from './posts.service';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('PostsService', () => {
  let service: PostsService;

  // Mock 사용자 데이터
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    email: 'test@example.com',
  };

  const anotherUser = {
    _id: '507f1f77bcf86cd799439012',
    username: 'anotheruser',
    email: 'another@example.com',
  };

  // Mock 게시글 데이터
  const mockPost = {
    _id: '507f1f77bcf86cd799439020',
    title: 'Test Post',
    content: 'This is test content',
    author: mockUser._id,
    createdAt: new Date(),
    updatedAt: new Date(),
    populate: jest.fn().mockReturnThis(),
  };

  // Mock PostModel
  const mockPostModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    save: jest.fn(),
    exec: jest.fn(),
    constructor: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getModelToken(Post.name),
          useValue: mockPostModel,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('새로운 게시글을 생성해야 함', async () => {
      const createPostDto: CreatePostDto = {
        title: 'New Post',
        content: 'New Content',
      };

      /**
       * 1. populate() 메서드 모킹
       * - save() 후 populate()를 체이닝으로 호출
       */
      const mockPopulate = jest.fn().mockResolvedValue({
        ...mockPost,
        author: mockUser,
      });

      /**
       * 2. save() 메서드 모킹
       * - save()가 populate 메서드를 가진 객체를 반환
       */
      const mockSave = jest.fn().mockResolvedValue({
        ...mockPost,
        populate: mockPopulate,
      });

      /**
       * 3. Mongoose 모델 인스턴스 모킹
       * - new this.postModel({...})가 반환할 객체
       */
      const mockPostInstance = {
        save: mockSave,
      };

      /**
       * 4. 생성자 함수 모킹
       * - new this.postModel({...})를 호출하면 mockPostInstance 반환
       */
      const mockConstructor = jest
        .fn()
        .mockImplementation(() => mockPostInstance);

      service = new PostsService(mockConstructor as any);

      /**
       * 5. create 메서드 실행
       */
      const result = await service.create(createPostDto, mockUser as any);

      /**
       * 6. 검증
       */
      // 생성자가 올바른 파라미터로 호출되었는지 확인
      expect(mockConstructor).toHaveBeenCalledWith({
        ...createPostDto,
        author: mockUser._id,
      });

      // save가 호출되었는지 확인
      expect(mockSave).toHaveBeenCalled();

      // populate이 올바른 파라미터로 호출되었는지 확인
      expect(mockPopulate).toHaveBeenCalledWith('author', 'username email');

      // 결과 확인
      expect(result).toEqual({
        ...mockPost,
        author: mockUser,
      });
    });
  });

  describe('findAll', () => {
    it('페이지네이션과 함께 모든 게시글을 반환해야 함', async () => {
      const page = 1;
      const limit = 10;
      const mockPosts = [mockPost];
      const totalCount = 1;

      /**
       * find() 체이닝 모킹
       */
      const mockExec = jest.fn().mockResolvedValue(mockPosts);
      const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort });
      const mockFind = jest.fn().mockReturnValue({ populate: mockPopulate });

      mockPostModel.find = mockFind;

      /**
       * countDocuments() 모킹
       */
      mockPostModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(totalCount),
      });

      const result = await service.findAll(page, limit);

      // find가 호출되었는지 확인
      expect(mockFind).toHaveBeenCalled();

      // populate이 올바른 파라미터로 호출되었는지 확인
      expect(mockPopulate).toHaveBeenCalledWith('author', 'username');

      // sort가 올바른 파라미터로 호출되었는지 확인
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });

      // skip이 올바른 값으로 호출되었는지 확인
      expect(mockSkip).toHaveBeenCalledWith(0);

      // limit이 올바른 값으로 호출되었는지 확인
      expect(mockLimit).toHaveBeenCalledWith(10);

      // countDocuments가 호출되었는지 확인
      expect(mockPostModel.countDocuments).toHaveBeenCalled();

      // 결과 확인
      expect(result).toEqual({
        page: 1,
        limit: 10,
        total: totalCount,
        posts: mockPosts,
      });
    });

    it('limit이 50을 초과하면 50으로 제한해야 함', async () => {
      const page = 1;
      const limit = 100;

      const mockExec = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort });
      const mockFind = jest.fn().mockReturnValue({ populate: mockPopulate });

      // mockPostModel.find.mockReturnValue({
      //   populate: jest.fn().mockReturnValue({
      //     sort: jest.fn().mockReturnValue({
      //       skip: jest.fn().mockReturnValue({
      //         limit: jest.fn().mockReturnValue({
      //           exec: jest.fn().mockResolvedValue(mockPosts),
      //         }),
      //       }),
      //     }),
      //   }),
      // });

      mockPostModel.find = mockFind;
      mockPostModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      const result = await service.findAll(page, limit);

      // limit이 50으로 제한되었는지 확인
      expect(mockLimit).toHaveBeenCalledWith(50);
      expect(result.limit).toBe(50);
    });
  });

  describe('findOne', () => {
    it('ID로 게시글을 찾아야 함', async () => {
      const postId = '507f1f77bcf86cd799439020';

      const mockExec = jest.fn().mockResolvedValue(mockPost);
      const mockPopulate = jest.fn().mockReturnValue({ exec: mockExec });
      const mockFindById = jest
        .fn()
        .mockReturnValue({ populate: mockPopulate });

      mockPostModel.findById = mockFindById;

      const result = await service.findOne(postId);

      // findById가 올바른 ID로 호출되었는지 확인
      expect(mockFindById).toHaveBeenCalledWith(postId);

      // populate이 올바른 파라미터로 호출되었는지 확인
      expect(mockPopulate).toHaveBeenCalledWith('author', 'username email');

      // 결과 확인
      expect(result).toEqual(mockPost);
    });

    it('게시글이 없으면 NotFoundException을 던져야 함', async () => {
      const postId = 'nonexistentid';

      mockPostModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findOne(postId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(postId)).rejects.toThrow(
        '게시글을 찾을 수 없습니다.',
      );
    });
  });

  describe('update', () => {
    it('게시글을 업데이트해야 함', async () => {
      const postId = '507f1f77bcf86cd799439020';
      const updatePostDto: UpdatePostDto = {
        title: 'Updated Title',
        content: 'Updated Content',
      };

      /**
       * findById로 찾은 게시글 모킹
       * - author는 mockUser._id와 같아야 권한 체크 통과
       */
      const foundPost = {
        ...mockPost,
        author: {
          toString: () => mockUser._id,
        },
        save: jest.fn(),
        populate: jest.fn(),
      };

      // save() 후 populate() 체이닝
      foundPost.save.mockResolvedValue({
        ...foundPost,
        ...updatePostDto,
        populate: foundPost.populate,
      });

      foundPost.populate.mockResolvedValue({
        ...foundPost,
        ...updatePostDto,
        author: mockUser,
      });

      mockPostModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(foundPost),
      });

      const result = await service.update(
        postId,
        updatePostDto,
        mockUser as any,
      );

      // findById가 올바른 ID로 호출되었는지 확인
      expect(mockPostModel.findById).toHaveBeenCalledWith(postId);

      // save가 호출되었는지 확인
      expect(foundPost.save).toHaveBeenCalled();

      // populate이 올바른 파라미터로 호출되었는지 확인
      expect(foundPost.populate).toHaveBeenCalledWith(
        'author',
        'username email',
      );

      // 결과 확인 (업데이트된 내용 포함)
      expect(result).toMatchObject(updatePostDto);
    });

    it('게시글이 없으면 NotFoundException을 던져야 함', async () => {
      const postId = 'nonexistentid';
      const updatePostDto: UpdatePostDto = {
        title: 'Updated Title',
      };

      mockPostModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update(postId, updatePostDto, mockUser as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('작성자가 아니면 ForbiddenException을 던져야 함', async () => {
      const postId = '507f1f77bcf86cd799439020';
      const updatePostDto: UpdatePostDto = {
        title: 'Updated Title',
      };

      const foundPost = {
        ...mockPost,
        author: {
          toString: () => mockUser._id, // 다른 사용자의 게시글
        },
      };

      mockPostModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(foundPost),
      });

      await expect(
        service.update(postId, updatePostDto, anotherUser as any),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.update(postId, updatePostDto, anotherUser as any),
      ).rejects.toThrow('게시글 수정 권한이 없습니다.');
    });
  });

  describe('remove', () => {
    it('게시글을 삭제해야 함', async () => {
      const postId = '507f1f77bcf86cd799439020';

      const foundPost = {
        ...mockPost,
        author: {
          toString: () => mockUser._id,
        },
      };

      mockPostModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(foundPost),
      });

      mockPostModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(foundPost),
      });

      await service.remove(postId, mockUser as any);

      // findById가 호출되었는지 확인
      expect(mockPostModel.findById).toHaveBeenCalledWith(postId);

      // findByIdAndDelete가 호출되었는지 확인
      expect(mockPostModel.findByIdAndDelete).toHaveBeenCalledWith(postId);
    });

    it('게시글이 없으면 NotFoundException을 던져야 함', async () => {
      const postId = 'nonexistentid';

      mockPostModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove(postId, mockUser as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('작성자가 아니면 ForbiddenException을 던져야 함', async () => {
      const postId = '507f1f77bcf86cd799439020';

      const foundPost = {
        ...mockPost,
        author: {
          toString: () => mockUser._id, // 다른 사용자의 게시글
        },
      };

      mockPostModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(foundPost),
      });

      await expect(service.remove(postId, anotherUser as any)).rejects.toThrow(
        ForbiddenException,
      );

      await expect(service.remove(postId, anotherUser as any)).rejects.toThrow(
        '게시글 삭제 권한이 없습니다.',
      );
    });
  });
});
