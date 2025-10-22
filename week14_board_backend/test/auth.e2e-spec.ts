import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // ValidationPipe 적용 (실제 앱과 동일하게)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // MongoDB 연결 가져오기
    connection = moduleFixture.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await connection.dropDatabase();
    await app.close();
  });

  describe('/auth/signup (POST)', () => {
    it('회원가입 성공', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', '회원가입 완료');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('_id');
          expect(res.body.user).toHaveProperty('username', 'testuser');
          expect(res.body.user).toHaveProperty('email', 'test@example.com');
          expect(res.body.user).not.toHaveProperty('password'); // 비밀번호는 반환되지 않아야 함
        });
    });

    it('중복된 이메일로 회원가입 실패 (409 Conflict)', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          username: 'anotheruser',
          email: 'test@example.com', // 이미 존재하는 이메일
          password: 'password123',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toBe('이미 존재하는 이메일입니다.');
        });
    });

    it('중복된 유저네임으로 회원가입 실패 (409 Conflict)', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          username: 'testuser', // 이미 존재하는 유저네임
          email: 'another@example.com',
          password: 'password123',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toBe('이미 존재하는 닉네임입니다.');
        });
    });

    it('유효하지 않은 데이터로 회원가입 실패 (400 Bad Request)', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          username: '',
          email: 'invalid-email', // 잘못된 이메일 형식
          password: '123', // 너무 짧은 비밀번호
        })
        .expect(400);
    });

    it('필수 필드 누락 시 회원가입 실패 (400 Bad Request)', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          username: 'onlyusername',
          // email, password 누락
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('로그인 성공', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('username', 'testuser');
          expect(res.body.user).toHaveProperty('email', 'test@example.com');
          expect(res.body.user).not.toHaveProperty('password');

          // 다음 테스트를 위해 토큰 저장
          accessToken = res.body.access_token;
        });
    });

    it('존재하지 않는 이메일로 로그인 실패 (401 Unauthorized)', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe(
            '이메일 또는 비밀번호가 잘못되었습니다.',
          );
        });
    });

    it('잘못된 비밀번호로 로그인 실패 (401 Unauthorized)', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe(
            '이메일 또는 비밀번호가 잘못되었습니다.',
          );
        });
    });

    it('유효하지 않은 데이터로 로그인 실패 (400 Bad Request)', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: '',
        })
        .expect(400);
    });
  });

  describe('JWT 인증 테스트', () => {
    it('유효한 토큰으로 보호된 엔드포인트 접근 성공', () => {
      // 실제 보호된 엔드포인트가 있다면 테스트
      // 예: /posts (POST)는 인증이 필요
      return request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Post',
          content: 'Test Content',
        })
        .expect(201);
    });

    it('토큰 없이 보호된 엔드포인트 접근 실패 (401 Unauthorized)', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Test Post',
          content: 'Test Content',
        })
        .expect(401);
    });

    it('유효하지 않은 토큰으로 보호된 엔드포인트 접근 실패 (401 Unauthorized)', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          title: 'Test Post',
          content: 'Test Content',
        })
        .expect(401);
    });
  });
});
