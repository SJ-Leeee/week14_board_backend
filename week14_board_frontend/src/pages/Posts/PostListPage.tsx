/**
 * 게시글 목록 페이지 - Padlet 스타일
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPosts } from '../../api/posts.api';

// 임시 더미 데이터 (실제로는 API에서 가져올 데이터)
const dummyPosts = [
  {
    _id: '1',
    title: '첫 번째 게시글',
    content: '안녕하세요! 정글 게시판에 오신 것을 환영합니다. 여기서 자유롭게 의견을 나눠보세요.',
    author: { _id: '1', username: '정글러1', email: 'user1@jungle.com' },
    createdAt: '2025-01-15',
    updatedAt: '2025-01-15',
  },
];

const PostListPage = () => {
  //
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState(dummyPosts);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 페이지 변경 핸들러
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 페이지 번호 배열 생성 (최대 5개씩 표시)
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };
  // API에서 게시글 가져오기
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getPosts(currentPage, 9); // 현재 페이지의 게시글 가져오기

        setPosts(response.posts);
        // totalPages가 undefined면 직접 계산
        const calculatedTotalPages = Math.ceil(response.total / 9);
        setTotalPages(calculatedTotalPages);
        setTotal(response.total);
      } catch (err) {
        setError('게시글을 불러오는데 실패했습니다.');
        // 에러 발생 시 더미 데이터 유지
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [currentPage]); // currentPage가 바뀔 때마다 API 재호출

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 섹션 */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-3">게시글 모아보기</h1>
          <p className="text-slate-600 text-lg">다양한 이야기를 자유롭게 공유하는 공간입니다</p>
        </div>

        {/* 새 글 작성 버튼 (모바일 포함) */}
        {isAuthenticated && (
          <div className="mb-8 flex justify-center">
            <Link
              to="/posts/new"
              className="button-hover inline-flex items-center bg-white text-slate-700 px-8 py-4 rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl border-2 border-slate-200"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              새 글 작성하기
            </Link>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-2xl text-center">
            <p className="font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm underline hover:text-red-800"
            >
              새로고침
            </button>
          </div>
        )}

        {/* 로딩 중 */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
              <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-3 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 그리드 레이아웃 - Padlet 스타일 */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <Link
                key={post._id}
                to={`/posts/${post._id}`}
                className="card-hover bg-white rounded-2xl shadow-lg overflow-hidden group"
              >
                {/* 카드 헤더 - 부드러운 그라데이션 */}
                <div className="h-3 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400"></div>

                {/* 카드 내용 */}
                <div className="p-6">
                  {/* 제목 */}
                  <h2 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {post.title}
                  </h2>

                  {/* 본문 미리보기 */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.content}</p>

                  {/* 메타 정보 */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {post.author.username.charAt(0)}
                      </div>
                      <span className="font-medium">{post.author.username}</span>
                    </div>
                    <span>{post.createdAt}</span>
                  </div>
                </div>

                {/* 카드 푸터 - 호버 시 표시되는 액션 힌트 */}
                <div className="px-6 pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="text-blue-600 text-sm font-semibold flex items-center">
                    자세히 보기
                    <svg
                      className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center space-x-2">
            {/* 이전 페이지 버튼 */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="button-hover px-4 py-2 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* 첫 페이지 */}
            {getPageNumbers()[0] > 1 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  className="button-hover px-4 py-2 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-semibold hover:border-slate-300 shadow-sm min-w-[44px]"
                >
                  1
                </button>
                {getPageNumbers()[0] > 2 && <span className="text-slate-400 px-2">...</span>}
              </>
            )}

            {/* 페이지 번호들 */}
            {getPageNumbers().map(pageNumber => (
              <button
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber)}
                className={`button-hover px-4 py-2 rounded-xl font-semibold shadow-sm min-w-[44px] ${
                  currentPage === pageNumber
                    ? 'bg-slate-700 text-white border-2 border-slate-700'
                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {pageNumber}
              </button>
            ))}

            {/* 마지막 페이지 */}
            {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
              <>
                {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                  <span className="text-slate-400 px-2">...</span>
                )}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className="button-hover px-4 py-2 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-semibold hover:border-slate-300 shadow-sm min-w-[44px]"
                >
                  {totalPages}
                </button>
              </>
            )}

            {/* 다음 페이지 버튼 */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="button-hover px-4 py-2 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}

        {/* 페이지 정보 */}
        {total > 0 && (
          <div className="mt-6 text-center text-sm text-slate-600">
            전체 {total}개 중 {(currentPage - 1) * 9 + 1}-{Math.min(currentPage * 9, total)}번째
            게시글
          </div>
        )}

        {/* 빈 상태 메시지 */}
        {posts.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 max-w-md mx-auto shadow-lg">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">아직 게시글이 없어요</h3>
              <p className="text-gray-600 mb-6">첫 번째 게시글을 작성해보세요!</p>
              {isAuthenticated && (
                <Link
                  to="/posts/new"
                  className="button-hover inline-block bg-slate-700 text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:bg-slate-800"
                >
                  글쓰기 시작하기
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostListPage;
