import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Posts (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let accessToken: string;
  let userId: string;
  let postId: string;
  let anotherUserToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    connection = moduleFixture.get<Connection>(getConnectionToken());

    // 테스트용 사용자 생성 및 로그인
    const signupResponse = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

    userId = signupResponse.body.user._id;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    accessToken = loginResponse.body.access_token;

    // 다른 사용자도 생성 (권한 테스트용)
    await request(app.getHttpServer()).post('/auth/signup').send({
      username: 'anotheruser',
      email: 'another@example.com',
      password: 'password123',
    });

    const anotherLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'another@example.com',
        password: 'password123',
      });

    anotherUserToken = anotherLoginResponse.body.access_token;
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await app.close();
  });

  describe('/posts (POST)', () => {
    it('게시글 생성 성공', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Post Title',
          content: 'This is test content',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body).toHaveProperty('title', 'Test Post Title');
          expect(res.body).toHaveProperty('content', 'This is test content');
          expect(res.body).toHaveProperty('author');
          expect(res.body.author).toHaveProperty('username', 'testuser');
          expect(res.body.author).toHaveProperty('email', 'test@example.com');

          // 다음 테스트를 위해 postId 저장
          postId = res.body._id;
        });
    });

    it('인증 없이 게시글 생성 실패 (401 Unauthorized)', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Test Post',
          content: 'Test Content',
        })
        .expect(401);
    });

    it('유효하지 않은 데이터로 게시글 생성 실패 (400 Bad Request)', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '', // 빈 제목
          content: '',
        })
        .expect(400);
    });

    it('필수 필드 누락 시 게시글 생성 실패 (400 Bad Request)', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Only Title',
          // content 누락
        })
        .expect(400);
    });
  });

  describe('/posts (GET)', () => {
    beforeAll(async () => {
      // 테스트용 게시글 여러 개 생성
      for (let i = 1; i <= 5; i++) {
        await request(app.getHttpServer())
          .post('/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: `Test Post ${i}`,
            content: `Content ${i}`,
          });
      }
    });

    it('모든 게시글 조회 성공 (페이지네이션)', () => {
      return request(app.getHttpServer())
        .get('/posts')
        .query({ page: 1, limit: 10 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('posts');
          expect(res.body).toHaveProperty('page', 1);
          expect(res.body).toHaveProperty('limit', 10);
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.posts)).toBe(true);
          expect(res.body.posts.length).toBeGreaterThan(0);
        });
    });

    it('페이지네이션 파라미터 없이 조회 성공 (기본값 적용)', () => {
      return request(app.getHttpServer())
        .get('/posts')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('page', 1);
          expect(res.body).toHaveProperty('limit', 10);
        });
    });

    it('limit이 50을 초과하면 50으로 제한', () => {
      return request(app.getHttpServer())
        .get('/posts')
        .query({ page: 1, limit: 100 })
        .expect(200)
        .expect((res) => {
          expect(res.body.limit).toBe(50);
        });
    });
  });

  describe('/posts/:id (GET)', () => {
    it('특정 게시글 조회 성공', () => {
      return request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id', postId);
          expect(res.body).toHaveProperty('title', 'Test Post Title');
          expect(res.body).toHaveProperty('content', 'This is test content');
          expect(res.body).toHaveProperty('author');
        });
    });

    it('존재하지 않는 게시글 조회 실패 (404 Not Found)', () => {
      return request(app.getHttpServer())
        .get('/posts/507f1f77bcf86cd799439999')
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe('게시글을 찾을 수 없습니다.');
        });
    });

    it('잘못된 ID 형식으로 조회 실패', () => {
      return request(app.getHttpServer()).get('/posts/invalid-id').expect(400); // Mongoose CastError
    });
  });

  describe('/posts/:id (PATCH)', () => {
    it('게시글 수정 성공', () => {
      return request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Title',
          content: 'Updated Content',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.post).toHaveProperty('_id', postId);
          expect(res.body.post).toHaveProperty('title', 'Updated Title');
          expect(res.body.post).toHaveProperty('content', 'Updated Content');
        });
    });

    it('인증 없이 게시글 수정 실패 (401 Unauthorized)', () => {
      return request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .send({
          title: 'Updated Title',
        })
        .expect(401);
    });

    it('다른 사용자의 게시글 수정 실패 (403 Forbidden)', () => {
      return request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send({
          title: 'Hacked Title',
        })
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toBe('게시글 수정 권한이 없습니다.');
        });
    });

    it('존재하지 않는 게시글 수정 실패 (404 Not Found)', () => {
      return request(app.getHttpServer())
        .patch('/posts/507f1f77bcf86cd799439999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Title',
        })
        .expect(404);
    });
  });

  describe('/posts/:id (DELETE)', () => {
    it('다른 사용자의 게시글 삭제 실패 (403 Forbidden)', () => {
      return request(app.getHttpServer())
        .delete(`/posts/${postId}`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toBe('게시글 삭제 권한이 없습니다.');
        });
    });

    it('인증 없이 게시글 삭제 실패 (401 Unauthorized)', () => {
      return request(app.getHttpServer())
        .delete(`/posts/${postId}`)
        .expect(401);
    });

    it('게시글 삭제 성공', () => {
      return request(app.getHttpServer())
        .delete(`/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('삭제된 게시글 조회 실패 (404 Not Found)', () => {
      return request(app.getHttpServer()).get(`/posts/${postId}`).expect(404);
    });

    it('존재하지 않는 게시글 삭제 실패 (404 Not Found)', () => {
      return request(app.getHttpServer())
        .delete('/posts/507f1f77bcf86cd799439999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
