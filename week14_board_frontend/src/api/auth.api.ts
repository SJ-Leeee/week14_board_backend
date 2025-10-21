/**
 * 인증 관련 API 호출 함수
 */

import axiosInstance from './axios';
import type { SignUpRequest, LoginRequest, AuthResponse } from '../types';

/**
 * 회원가입 API
 * POST /auth/signup
 */
export const signUp = async (data: SignUpRequest): Promise<AuthResponse> => {
  const response = await axiosInstance.post<AuthResponse>('/auth/signup', data);
  return response.data;
};

/**
 * 로그인 API
 * POST /auth/login
 */
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await axiosInstance.post<AuthResponse>('/auth/login', data);
  return response.data;
};
