/**
 * 404 페이지 - Padlet 스타일
 */

import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-lg px-4">
        {/* 404 일러스트 */}
        <div className="mb-8">
          <div className="relative">
            <h1 className="text-9xl font-black text-white/20 select-none">404</h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center transform -rotate-12 hover:rotate-0 transition-transform duration-300">
                <svg
                  className="w-16 h-16 text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 메시지 */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-10 mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            페이지를 찾을 수 없어요
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>

          {/* 버튼 그룹 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="button-hover inline-flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl text-base font-bold shadow-lg"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              홈으로 돌아가기
            </Link>

            <button
              onClick={() => window.history.back()}
              className="button-hover inline-flex items-center justify-center bg-white text-gray-700 px-8 py-4 rounded-xl text-base font-bold shadow-lg border-2 border-gray-200 hover:border-purple-300"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              이전 페이지로
            </button>
          </div>
        </div>

        {/* 추가 도움말 */}
        <p className="text-white/80 text-sm">
          문제가 지속되면{' '}
          <Link to="/" className="text-white font-semibold hover:underline">
            메인 페이지
          </Link>
          로 이동해보세요
        </p>
      </div>
    </div>
  );
};

export default NotFound;
