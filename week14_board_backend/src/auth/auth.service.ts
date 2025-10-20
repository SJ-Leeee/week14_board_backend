import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    // username, email, pw는 이미 한번 검증을 하고 들어옴
    const { username, email, password } = signUpDto;

    // 이메일 중복 체크
    const existEmail = await this.usersService.findByEmail(email);
    if (existEmail) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    // username 중복체크
    // 실제서비스에서는 중복허용을 고려
    const existUsername = await this.usersService.findByUsername(username);
    if (existUsername) {
      throw new ConflictException('이미 존재하는 닉네임입니다.');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = await this.usersService.create(
      username,
      email,
      hashedPassword,
    );

    return {
      message: '회원가입 완료',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 사용자 찾기
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다.');
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다.');
    }

    // JWT 토큰 생성
    const payload = { sub: user._id, email: user.email };
    // 기한, 시크릿키는 전역으로 설정
    // iat, exp도 JwtService객체 내에서 설정
    const access_token = this.jwtService.sign(payload);

    return { access_token };
  }
}
