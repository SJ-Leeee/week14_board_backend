/**
 * 게시글 관련 API 호출 함수
 */

import axiosInstance from './axios';
import type { Post, PostListResponse, CreatePostRequest, UpdatePostRequest } from '../types';

/**
 * 게시글 목록 조회 (페이징)
 * GET /posts?page=1&limit=10
 */
export const getPosts = async (page = 1, limit = 10): Promise<PostListResponse> => {
  const response = await axiosInstance.get<PostListResponse>('/posts', {
    params: { page, limit },
  });
  return response.data;
};

/**
 * 게시글 상세 조회
 * GET /posts/:id
 */
export const getPost = async (id: string): Promise<Post> => {
  const response = await axiosInstance.get<Post>(`/posts/${id}`);
  return response.data;
};

/**
 * 게시글 생성 (인증 필요)
 * POST /posts
 */
export const createPost = async (data: CreatePostRequest): Promise<Post> => {
  const response = await axiosInstance.post<Post>('/posts', data);
  return response.data;
};

/**
 * 게시글 수정 (인증 필요)
 * PATCH /posts/:id
 */
export const updatePost = async (
  id: string,
  data: UpdatePostRequest
): Promise<{ message: string; post: Post }> => {
  const response = await axiosInstance.patch(`/posts/${id}`, data);
  return response.data;
};

/**
 * 게시글 삭제 (인증 필요)
 * DELETE /posts/:id
 */
export const deletePost = async (id: string): Promise<{ message: string }> => {
  const response = await axiosInstance.delete(`/posts/${id}`);
  return response.data;
};
