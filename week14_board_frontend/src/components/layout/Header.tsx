/**
 * Header 컴포넌트
 * - 모든 페이지 상단에 표시
 * - 로그인 상태에 따라 다른 메뉴 표시
 * - 정글 그린(#82b553) 포인트 컬러 사용
 */

import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    // 로그아웃 후 홈으로 이동은 axios 인터셉터가 처리
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-md border-b border-slate-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* 로고 */}
          <Link
            to="/"
            className="flex items-center space-x-3 group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-md transform transition-all duration-300 group-hover:scale-110">
              <span className="text-white font-bold text-2xl">J</span>
            </div>
            <span className="text-2xl font-bold text-slate-800">
              정글 게시판
            </span>
          </Link>

          {/* 네비게이션 */}
          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="text-slate-700 hover:text-slate-900 transition-all duration-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-100"
            >
              게시글
            </Link>

            {isAuthenticated ? (
              // 로그인 상태
              <>
                <Link
                  to="/posts/new"
                  className="button-hover bg-slate-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:bg-slate-800"
                >
                  + 글쓰기
                </Link>
                <span className="text-slate-700 text-sm font-medium px-3 py-2 bg-slate-100 rounded-xl">
                  {user?.username}님
                </span>
                <button
                  onClick={handleLogout}
                  className="button-hover text-slate-700 hover:text-red-600 transition-all duration-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-50"
                >
                  로그아웃
                </button>
              </>
            ) : (
              // 비로그인 상태
              <>
                <Link
                  to="/login"
                  className="button-hover text-slate-700 hover:text-slate-900 transition-all duration-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-100"
                >
                  로그인
                </Link>
                <Link
                  to="/signup"
                  className="button-hover bg-slate-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:bg-slate-800"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
