/**
 * 게시글 관련 타입 정의
 */

import type { User } from './auth.types';

// 게시글 생성 요청
export interface CreatePostRequest {
  title: string;
  content: string;
}

// 게시글 수정 요청
export interface UpdatePostRequest {
  title?: string;
  content?: string;
}

// 게시글 데이터
export interface Post {
  _id: string;
  title: string;
  content: string;
  author: User; // 작성자 정보
  createdAt: string;
  updatedAt: string;
}

// 게시글 목록 응답 (페이징 포함)
export interface PostListResponse {
  posts: Post[];
  total: number; // 전체 게시글 수
  page: number; // 현재 페이지
  limit: number; // 페이지당 개수
  totalPages: number; // 전체 페이지 수
}
