/**
 * 환경변수 설정
 *
 * 로컬 개발: http://localhost:3000
 * 프로덕션: 환경변수에서 읽거나 기본값 사용
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// 기타 설정
export const APP_NAME = '게시판';
export const APP_VERSION = '1.0.0';
