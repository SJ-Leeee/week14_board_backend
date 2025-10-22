import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Comments (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let accessToken: string;
  let postId: string;

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
    await request(app.getHttpServer()).post('/auth/signup').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    accessToken = loginResponse.body.access_token;

    // 테스트용 게시글 생성
    const postResponse = await request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Test Post for Comments',
        content: 'This post is for testing comments',
      });

    postId = postResponse.body._id;
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await app.close();
  });

  describe('/posts/:postId/comments (POST)', () => {
    it('댓글 생성 성공', () => {
      return request(app.getHttpServer())
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'This is a test comment',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body).toHaveProperty('content', 'This is a test comment');
          expect(res.body).toHaveProperty('author');
          expect(res.body.author).toHaveProperty('username', 'testuser');
          expect(res.body.author).toHaveProperty('email', 'test@example.com');
          expect(res.body).toHaveProperty('post', postId);
        });
    });

    it('인증 없이 댓글 생성 실패 (401 Unauthorized)', () => {
      return request(app.getHttpServer())
        .post(`/posts/${postId}/comments`)
        .send({
          content: 'This is a test comment',
        })
        .expect(401);
    });

    it('존재하지 않는 게시글에 댓글 생성 실패 (404 Not Found)', () => {
      return request(app.getHttpServer())
        .post('/posts/507f1f77bcf86cd799439999/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'This is a test comment',
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe('게시글을 찾을 수 없습니다.');
        });
    });

    it('유효하지 않은 데이터로 댓글 생성 실패 (400 Bad Request)', () => {
      return request(app.getHttpServer())
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: '', // 빈 내용
        })
        .expect(400);
    });

    it('필수 필드 누락 시 댓글 생성 실패 (400 Bad Request)', () => {
      return request(app.getHttpServer())
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          // content 누락
        })
        .expect(400);
    });

    it('잘못된 게시글 ID 형식으로 댓글 생성 실패', () => {
      return request(app.getHttpServer())
        .post('/posts/invalid-id/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'This is a test comment',
        })
        .expect(500); // Mongoose CastError
    });
  });

  describe('/posts/:postId/comments (GET)', () => {
    beforeAll(async () => {
      // 테스트용 댓글 여러 개 생성
      for (let i = 1; i <= 3; i++) {
        await request(app.getHttpServer())
          .post(`/posts/${postId}/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            content: `Test Comment ${i}`,
          });
      }
    });

    it('특정 게시글의 모든 댓글 조회 성공', () => {
      return request(app.getHttpServer())
        .get(`/posts/${postId}/comments`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('content');
          expect(res.body[0]).toHaveProperty('author');
          expect(res.body[0].author).toHaveProperty('username');
        });
    });

    it('존재하지 않는 게시글의 댓글 조회 실패 (404 Not Found)', () => {
      return request(app.getHttpServer())
        .get('/posts/507f1f77bcf86cd799439999/comments')
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe('게시글을 찾을 수 없습니다.');
        });
    });

    it('댓글이 없는 게시글의 경우 빈 배열 반환', async () => {
      // 새로운 게시글 생성 (댓글 없음)
      const newPostResponse = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Post without comments',
          content: 'This post has no comments',
        });

      const newPostId = newPostResponse.body._id;

      return request(app.getHttpServer())
        .get(`/posts/${newPostId}/comments`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0);
        });
    });

    it('잘못된 게시글 ID 형식으로 댓글 조회 실패', () => {
      return request(app.getHttpServer())
        .get('/posts/invalid-id/comments')
        .expect(500); // Mongoose CastError
    });
  });

  describe('댓글 정렬 테스트', () => {
    it('댓글이 최신순으로 정렬되어야 함', async () => {
      const response = await request(app.getHttpServer())
        .get(`/posts/${postId}/comments`)
        .expect(200);

      const comments = response.body;

      // 최신 댓글이 먼저 오는지 확인 (createdAt 기준 내림차순)
      for (let i = 0; i < comments.length - 1; i++) {
        const currentDate = new Date(comments[i].createdAt);
        const nextDate = new Date(comments[i + 1].createdAt);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(
          nextDate.getTime(),
        );
      }
    });
  });

  describe('통합 시나리오 테스트', () => {
    it('게시글 생성 → 댓글 작성 → 댓글 조회 전체 흐름 테스트', async () => {
      // 1. 새 게시글 생성
      const postResponse = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Integration Test Post',
          content: 'Testing full workflow',
        })
        .expect(201);

      const newPostId = postResponse.body._id;

      // 2. 댓글 작성
      await request(app.getHttpServer())
        .post(`/posts/${newPostId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'First comment on new post',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/posts/${newPostId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Second comment on new post',
        })
        .expect(201);

      // 3. 댓글 조회
      const commentsResponse = await request(app.getHttpServer())
        .get(`/posts/${newPostId}/comments`)
        .expect(200);

      expect(commentsResponse.body.length).toBe(2);
      expect(commentsResponse.body[0].content).toBe(
        'Second comment on new post',
      );
      expect(commentsResponse.body[1].content).toBe(
        'First comment on new post',
      );
    });
  });
});
