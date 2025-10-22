/**
 * axios 인스턴스 설정
 *
 * 왜 필요한가?
 * - 모든 API 요청에 공통 설정(baseURL, 헤더)을 자동으로 적용
 * - JWT 토큰을 요청마다 수동으로 추가할 필요 없음 (인터셉터가 자동 처리)
 */

import axios from 'axios';
import { API_BASE_URL } from '../config';

// axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: API_BASE_URL, // 환경변수에서 가져옴
  timeout: 10000, // 10초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 요청 인터셉터
 * 모든 API 요청 전에 자동으로 실행됨
 *
 * 역할: localStorage에 저장된 JWT 토큰을 헤더에 자동으로 추가
 */
axiosInstance.interceptors.request.use(
  config => {
    // localStorage에서 토큰 가져오기
    const token = localStorage.getItem('access_token');

    // 토큰이 있으면 Authorization 헤더에 추가
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

/**
 * 응답 인터셉터
 * 모든 API 응답 후에 자동으로 실행됨
 *
 * 역할: 401 에러(인증 실패) 시 자동으로 로그아웃 처리
 */
axiosInstance.interceptors.response.use(
  response => {
    // 정상 응답은 그대로 반환
    return response;
  },
  error => {
    // 401 에러면 토큰이 만료되었거나 유효하지 않음
    if (error.response?.status === 401) {
      // 로그인/회원가입 페이지에서는 리다이렉트하지 않음
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/signup') {
        // 토큰 삭제
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');

        // 로그인 페이지로 리다이렉트
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
