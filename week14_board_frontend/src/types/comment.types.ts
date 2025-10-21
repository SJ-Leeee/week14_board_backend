/**
 * 댓글 관련 타입 정의
 */

import type { User } from './auth.types';

// 댓글 생성 요청
export interface CreateCommentRequest {
  content: string;
}

// 댓글 데이터
export interface Comment {
  _id: string;
  content: string;
  author: User;
  post: string; // 게시글 ID
  createdAt: string;
  updatedAt: string;
}
