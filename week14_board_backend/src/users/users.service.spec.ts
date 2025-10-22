import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from './users.service';
import { User, UserDocument } from './schemas/user.schema';

describe('UsersService', () => {
  let service: UsersService;
  let model: Model<UserDocument>;

  // Mock 데이터
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword123',
    createdAt: new Date(),
  };

  // Mock UserModel
  const mockUserModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
    exec: jest.fn(),
    constructor: jest.fn(),
  };

  beforeEach(async () => {
    // UserService에서 mockUserModel을 사용하게 끔,,?
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get<Model<UserDocument>>(getModelToken(User.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('이메일로 사용자를 찾아야 함', async () => {
      const email = 'test@example.com';

      // 가짜 유저모델의 exec값을 mockUser로 세팅
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      // UserService는 여기 model에서
      const result = await service.findByEmail(email);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
      expect(result).toEqual(mockUser);
    });

    it('사용자가 없으면 null을 반환해야 함', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('사용자명으로 사용자를 찾아야 함', async () => {
      const username = 'testuser';

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findByUsername(username);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ username });
      expect(result).toEqual(mockUser);
    });

    it('사용자가 없으면 null을 반환해야 함', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('ID로 사용자를 찾아야 함', async () => {
      const userId = '507f1f77bcf86cd799439011';

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findById(userId);

      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('사용자가 없으면 null을 반환해야 함', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findById('nonexistentid');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('새로운 사용자를 생성해야 함', async () => {
      const username = 'newuser';
      const email = 'newuser@example.com';
      const password = 'hashedPassword123';

      /**
       * 1. save() 메서드 모킹
       * - Mongoose 인스턴스의 save() 메서드를 시뮬레이션
       * - 실제 DB 저장 대신 mockUser를 반환
       */
      const mockSave = jest.fn().mockResolvedValue(mockUser);

      /**
       * 2. Mongoose 모델 인스턴스 모킹
       * - new this.userModel({...})가 반환할 객체
       * - save 메서드를 가지고 있어야 함
       */
      const mockUserInstance = {
        save: mockSave,
      };

      /**
       * 3. 생성자 함수 모킹
       * - service.create()에서 new this.userModel({...})를 호출하면
       * - 이 mockConstructor가 실행되어 mockUserInstance를 반환
       *
       * 실제 동작:
       * const newUser = new this.userModel({ username, email, password });
       *                 └─> mockConstructor 호출됨
       *                     └─> mockUserInstance 반환
       */
      const mockConstructor = jest
        .fn()
        .mockImplementation(() => mockUserInstance);

      /**
       * 4. UsersService를 새로 생성하여 모킹된 모델 주입
       * - mockConstructor를 Mongoose 모델처럼 사용
       */
      service = new UsersService(mockConstructor as any);

      /**
       * 5. create 메서드 실행
       */
      const result = await service.create(username, email, password);

      /**
       * 6. 검증
       */
      // 생성자가 올바른 파라미터로 호출되었는지 확인
      expect(mockConstructor).toHaveBeenCalledWith({
        username,
        email,
        password,
      });

      // save() 메서드가 호출되었는지 확인
      expect(mockSave).toHaveBeenCalled();

      // 반환값이 예상한 mockUser인지 확인
      expect(result).toEqual(mockUser);
    });
  });
});
