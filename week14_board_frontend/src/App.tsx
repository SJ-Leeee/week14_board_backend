/**
 * App.tsx - 애플리케이션 메인 컴포넌트
 *
 * React Router란?
 * - 페이지 이동을 관리하는 라이브러리
 * - URL에 따라 다른 컴포넌트를 보여줌
 * - /login -> LoginPage, /posts -> PostListPage 등
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';

// Pages
import LoginPage from './pages/Auth/LoginPage';
import SignUpPage from './pages/Auth/SignUpPage';
import PostListPage from './pages/Posts/PostListPage';
import PostDetailPage from './pages/Posts/PostDetailPage';
import PostFormPage from './pages/Posts/PostFormPage';
import NotFound from './pages/NotFound';

/**
 * PrivateRoute - 로그인이 필요한 페이지 보호
 * 로그인하지 않으면 자동으로 로그인 페이지로 이동
 */
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* 인증 페이지 (Layout 없이 전체 화면) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          {/* 게시판 페이지 (Layout 포함) */}
          <Route
            path="/"
            element={
              <Layout>
                <PostListPage />
              </Layout>
            }
          />
          <Route
            path="/posts/:id"
            element={
              <Layout>
                <PostDetailPage />
              </Layout>
            }
          />

          {/* 로그인 필요 페이지 */}
          <Route
            path="/posts/new"
            element={
              <PrivateRoute>
                <Layout>
                  <PostFormPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/posts/:id/edit"
            element={
              <PrivateRoute>
                <Layout>
                  <PostFormPage />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* 404 페이지 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
