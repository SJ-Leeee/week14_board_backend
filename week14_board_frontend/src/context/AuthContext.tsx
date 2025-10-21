/**
 * AuthContext - 로그인 상태 전역 관리
 *
 * Context API란?
 * - React에서 전역 상태를 관리하는 내장 기능
 * - 여러 컴포넌트에서 로그인 정보를 공유할 수 있음
 * - props를 일일이 전달할 필요 없음
 */

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';

// Context에서 제공할 값의 타입 정의
interface AuthContextType {
  user: User | null; // 현재 로그인한 사용자 정보 (없으면 null)
  token: string | null; // JWT 토큰
  login: (token: string, user: User) => void; // 로그인 함수
  logout: () => void; // 로그아웃 함수
  isAuthenticated: boolean; // 로그인 여부
}

// Context 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider - Context를 제공하는 컴포넌트
 * App.tsx에서 최상위에 감싸서 사용
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // 컴포넌트 마운트 시 localStorage에서 로그인 정보 복원
  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // 로그인 함수
  const login = (newToken: string, newUser: User) => {
    // 상태 업데이트
    setToken(newToken);
    setUser(newUser);

    // localStorage에 저장 (새로고침해도 유지되도록)
    localStorage.setItem('access_token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  // 로그아웃 함수
  const logout = () => {
    // 상태 초기화
    setToken(null);
    setUser(null);

    // localStorage에서 삭제
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  };

  // 로그인 여부
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth - AuthContext를 사용하기 위한 커스텀 훅
 *
 * 사용법:
 * const { user, login, logout, isAuthenticated } = useAuth();
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
