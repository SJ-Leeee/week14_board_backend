import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

// JWT 인증이 필요한 엔드포인트용
export function ApiAuth(summary: string, description?: string) {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary, description }),
    ApiResponse({ status: 401, description: '인증 실패' }),
  );
}

// MongoDB ObjectId 파라미터용
export function ApiMongoIdParam(name: string = 'id') {
  return applyDecorators(
    ApiParam({
      name,
      description: `${name} (MongoDB ObjectId)`,
      example: '507f1f77bcf86cd799439011',
    }),
  );
}

// 게시글 작성
export function ApiCreatePost() {
  return applyDecorators(
    ApiAuth('게시글 작성', '새로운 게시글을 작성합니다. (로그인 필요)'),
    ApiResponse({ status: 201, description: '게시글 작성 성공' }),
    ApiResponse({ status: 400, description: '잘못된 요청' }),
  );
}

// 게시글 수정
export function ApiUpdatePost() {
  return applyDecorators(
    ApiAuth('게시글 수정', '게시글을 수정합니다. (작성자만 가능)'),
    ApiMongoIdParam('id'),
    ApiResponse({ status: 200, description: '게시글 수정 성공' }),
    ApiResponse({ status: 403, description: '수정 권한 없음' }),
    ApiResponse({ status: 404, description: '게시글을 찾을 수 없음' }),
  );
}

// 게시글 삭제
export function ApiDeletePost() {
  return applyDecorators(
    ApiAuth('게시글 삭제', '게시글을 삭제합니다. (작성자만 가능)'),
    ApiMongoIdParam('id'),
    ApiResponse({ status: 200, description: '게시글 삭제 성공' }),
    ApiResponse({ status: 403, description: '삭제 권한 없음' }),
    ApiResponse({ status: 404, description: '게시글을 찾을 수 없음' }),
  );
}

// 게시글 상세 조회
export function ApiGetPost() {
  return applyDecorators(
    ApiOperation({
      summary: '게시글 상세 조회',
      description: 'ID로 특정 게시글을 조회합니다.',
    }),
    ApiMongoIdParam('id'),
    ApiResponse({ status: 200, description: '게시글 조회 성공' }),
    ApiResponse({ status: 404, description: '게시글을 찾을 수 없음' }),
    ApiResponse({ status: 400, description: '잘못된 ID 형식' }),
  );
}

// 댓글 작성
export function ApiCreateComment() {
  return applyDecorators(
    ApiAuth('댓글 작성', '게시글에 댓글을 작성합니다. (로그인 필요)'),
    ApiMongoIdParam('postId'),
    ApiResponse({ status: 201, description: '댓글 작성 성공' }),
    ApiResponse({ status: 404, description: '게시글을 찾을 수 없음' }),
  );
}

// 댓글 목록 조회
export function ApiGetComments() {
  return applyDecorators(
    ApiOperation({
      summary: '댓글 목록 조회',
      description: '특정 게시글의 모든 댓글을 조회합니다.',
    }),
    ApiMongoIdParam('postId'),
    ApiResponse({ status: 200, description: '댓글 목록 조회 성공' }),
    ApiResponse({ status: 404, description: '게시글을 찾을 수 없음' }),
  );
}

// 게시글 목록 조회
export function ApiGetAllPosts() {
  return applyDecorators(
    ApiOperation({
      summary: '게시글 목록 조회',
      description: '게시글 목록을 페이지네이션하여 조회합니다.',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      description: '페이지 번호',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: '페이지당 게시글 수',
      example: 10,
    }),
    ApiResponse({ status: 200, description: '게시글 목록 조회 성공' }),
  );
}

// 회원가입
export function ApiSignUp() {
  return applyDecorators(
    ApiOperation({
      summary: '회원가입',
      description: '새로운 사용자를 등록합니다.',
    }),
    ApiResponse({ status: 201, description: '회원가입 성공' }),
    ApiResponse({ status: 400, description: '잘못된 요청 (유효성 검증 실패)' }),
    ApiResponse({ status: 409, description: '이미 존재하는 이메일' }),
  );
}

// 로그인
export function ApiLogin() {
  return applyDecorators(
    ApiOperation({
      summary: '로그인',
      description: '이메일과 비밀번호로 로그인합니다.',
    }),
    ApiResponse({ status: 200, description: '로그인 성공, JWT 토큰 반환' }),
    ApiResponse({
      status: 401,
      description: '인증 실패 (이메일 또는 비밀번호 불일치)',
    }),
  );
}
