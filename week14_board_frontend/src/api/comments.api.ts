/**
 * 댓글 관련 API 호출 함수
 */

import axiosInstance from './axios';
import { Comment, CreateCommentRequest } from '../types';

/**
 * 댓글 목록 조회
 * GET /posts/:postId/comments
 */
export const getComments = async (postId: string): Promise<Comment[]> => {
  const response = await axiosInstance.get<Comment[]>(`/posts/${postId}/comments`);
  return response.data;
};

/**
 * 댓글 생성 (인증 필요)
 * POST /posts/:postId/comments
 */
export const createComment = async (
  postId: string,
  data: CreateCommentRequest
): Promise<Comment> => {
  const response = await axiosInstance.post<Comment>(`/posts/${postId}/comments`, data);
  return response.data;
};
