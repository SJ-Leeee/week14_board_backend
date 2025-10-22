import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'; // import 필요
import { SignUpDto } from './dto/signup.dto';
import { UsersService } from '../users/users.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  // Mock 사용자 데이터
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    email: 'test@example.com',
  };

  const mockSignUpDto: SignUpDto = {
    username: 'mockUsername',
    email: 'mockemail@email.com',
    password: 'mockpassword1234',
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn((payload) => 'mock-jwt-token-' + payload.sub),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  describe('signUp', () => {
    it('이메일 존재하면 ConflictException', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ ...mockUser });

      await expect(service.signUp(mockSignUpDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.signUp(mockSignUpDto)).rejects.toThrow(
        '이미 존재하는 이메일입니다.',
      );
    });

    it('유저네임이 존재하면 ConflictException', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.findByUsername.mockResolvedValue({ ...mockUser });

      await expect(service.signUp(mockSignUpDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.signUp(mockSignUpDto)).rejects.toThrow(
        '이미 존재하는 닉네임입니다.',
      );
    });
    it('새로운 사용자를 성공적으로 생성해야 함', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.findByUsername.mockResolvedValue(null);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      mockUsersService.create.mockResolvedValue({
        _id: 'userId',
        username: mockSignUpDto.username,
        email: mockSignUpDto.email,
        password: 'hashedPassword123',
      });

      const result = await service.signUp(mockSignUpDto);

      // bcrypt.hash가 호출되었는지만 확인
      expect(bcrypt.hash).toHaveBeenCalledWith(mockSignUpDto.password, 10);
      // create가 해싱된 비밀번호로 호출되었는지 확인
      expect(mockUsersService.create).toHaveBeenCalledWith(
        mockSignUpDto.username,
        mockSignUpDto.email,
        'hashedPassword123',
      );

      // 결과 확인
      expect(result).toBeDefined();
      expect(result.user.username).toBe(mockSignUpDto.username);
    });
  });

  describe('login', () => {
    const mockLoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUserWithPassword = {
      _id: '507f1f77bcf86cd799439011',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedPassword123',
    };

    /**
     * 1. 이메일 검증 - 사용자가 존재하지 않으면 UnauthorizedException
     */
    it('존재하지 않는 이메일이면 UnauthorizedException을 던져야 함', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        '이메일 또는 비밀번호가 잘못되었습니다.',
      );
    });

    /**
     * 2. 비밀번호 검증 - 비밀번호가 틀리면 UnauthorizedException
     */
    it('잘못된 비밀번호면 UnauthorizedException을 던져야 함', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUserWithPassword);

      // bcrypt.compare 실패 (비밀번호 불일치)
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        '이메일 또는 비밀번호가 잘못되었습니다.',
      );

      // bcrypt.compare가 호출되었는지 확인
      expect(bcrypt.compare).toHaveBeenCalledWith(
        mockLoginDto.password,
        mockUserWithPassword.password,
      );
    });

    /**
     * 3. 로그인 성공 - access_token과 사용자 정보 반환
     */
    it('올바른 이메일과 비밀번호로 로그인 성공해야 함', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUserWithPassword);

      // bcrypt.compare 성공
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // jwtService.sign 모킹
      mockJwtService.sign.mockReturnValue('mock-access-token');

      const result = await service.login(mockLoginDto);

      // bcrypt.compare가 올바르게 호출되었는지 확인
      expect(bcrypt.compare).toHaveBeenCalledWith(
        mockLoginDto.password,
        mockUserWithPassword.password,
      );

      // jwtService.sign이 올바른 payload로 호출되었는지 확인
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUserWithPassword._id,
        email: mockUserWithPassword.email,
      });

      // 결과 확인
      expect(result).toEqual({
        access_token: 'mock-access-token',
        user: {
          _id: mockUserWithPassword._id,
          username: mockUserWithPassword.username,
          email: mockUserWithPassword.email,
        },
      });
    });
  });
});
