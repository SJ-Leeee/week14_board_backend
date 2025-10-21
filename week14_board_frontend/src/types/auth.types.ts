/**
 * 인증 관련 타입 정의
 * 백엔드 DTO와 동일한 구조로 작성
 */

// 회원가입 요청 데이터
export interface SignUpRequest {
  username: string; // 최소 2자
  email: string;
  password: string; // 최소 6자
}

// 로그인 요청 데이터
export interface LoginRequest {
  email: string;
  password: string;
}

// 로그인 응답 데이터 (백엔드에서 받는 형태)
export interface AuthResponse {
  access_token: string; // JWT 토큰
  user: User;
}

// 사용자 정보
export interface User {
  _id: string;
  username: string;
  email: string;
}
