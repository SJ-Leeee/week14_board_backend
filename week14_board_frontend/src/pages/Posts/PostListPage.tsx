/**
 * 게시글 목록 페이지 - Padlet 스타일
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// 임시 더미 데이터 (실제로는 API에서 가져올 데이터)
const dummyPosts = [
  {
    id: 1,
    title: '첫 번째 게시글',
    content: '안녕하세요! 정글 게시판에 오신 것을 환영합니다. 여기서 자유롭게 의견을 나눠보세요.',
    author: { username: '정글러1' },
    createdAt: '2025-01-15',
  },
  {
    id: 2,
    title: '코딩 테스트 팁 공유',
    content: '알고리즘 문제를 풀 때 도움이 되는 팁들을 공유합니다. 시간 복잡도를 항상 고려하세요!',
    author: { username: '알고리즘왕' },
    createdAt: '2025-01-16',
  },
  {
    id: 3,
    title: 'React 학습 자료',
    content: 'React를 공부하는 분들께 추천하는 자료들입니다. 공식 문서를 꼭 읽어보세요.',
    author: { username: 'React개발자' },
    createdAt: '2025-01-17',
  },
  {
    id: 4,
    title: '프로젝트 협업 경험',
    content: '팀 프로젝트를 진행하면서 겪었던 경험을 공유합니다. 커뮤니케이션이 정말 중요해요!',
    author: { username: '협업마스터' },
    createdAt: '2025-01-18',
  },
  {
    id: 5,
    title: 'TypeScript 왜 쓰나요?',
    content: 'TypeScript를 사용하면 타입 안정성을 확보할 수 있어요. 초기 학습 곡선은 있지만 충분히 가치있습니다.',
    author: { username: 'TS전도사' },
    createdAt: '2025-01-19',
  },
  {
    id: 6,
    title: '백엔드 API 설계 고민',
    content: 'RESTful API를 설계할 때 고려해야 할 사항들에 대해 이야기해봅시다.',
    author: { username: '백엔드개발자' },
    createdAt: '2025-01-20',
  },
  {
    id: 7,
    title: 'Git 브랜치 전략',
    content: 'Git Flow와 GitHub Flow의 차이점을 알아보고, 우리 팀에 맞는 전략을 찾아봅시다.',
    author: { username: 'Git마스터' },
    createdAt: '2025-01-21',
  },
  {
    id: 8,
    title: 'CSS 레이아웃 기초',
    content: 'Flexbox와 Grid의 차이점과 각각의 사용 사례에 대해 정리했습니다.',
    author: { username: 'CSS전문가' },
    createdAt: '2025-01-22',
  },
  {
    id: 9,
    title: '데이터베이스 정규화',
    content: '1NF부터 3NF까지, 데이터베이스 정규화의 개념과 실제 적용 사례를 공유합니다.',
    author: { username: 'DB관리자' },
    createdAt: '2025-01-23',
  },
  {
    id: 10,
    title: '클린 코드 작성법',
    content: '읽기 좋은 코드를 작성하는 방법과 네이밍 컨벤션에 대해 이야기해봅시다.',
    author: { username: '클린코더' },
    createdAt: '2025-01-24',
  },
  {
    id: 11,
    title: 'Docker 입문',
    content: '컨테이너 기술의 기초부터 Docker Compose 활용까지 단계별로 알아봅시다.',
    author: { username: '데브옵스' },
    createdAt: '2025-01-25',
  },
  {
    id: 12,
    title: 'Next.js vs Create React App',
    content: '각각의 장단점을 비교하고 프로젝트에 맞는 선택을 할 수 있도록 정리했습니다.',
    author: { username: 'React개발자' },
    createdAt: '2025-01-26',
  },
  {
    id: 13,
    title: '웹 접근성의 중요성',
    content: 'ARIA 속성과 시맨틱 HTML을 활용한 접근성 개선 방법을 소개합니다.',
    author: { username: 'A11y전문가' },
    createdAt: '2025-01-27',
  },
  {
    id: 14,
    title: '성능 최적화 체크리스트',
    content: '프론트엔드 성능을 개선하기 위한 실용적인 팁들을 모았습니다.',
    author: { username: '성능튜너' },
    createdAt: '2025-01-28',
  },
  {
    id: 15,
    title: 'OAuth 2.0 이해하기',
    content: '인증과 인가의 차이점, OAuth 2.0의 동작 원리를 쉽게 설명합니다.',
    author: { username: '보안전문가' },
    createdAt: '2025-01-29',
  },
  {
    id: 16,
    title: '함수형 프로그래밍 입문',
    content: '순수 함수, 불변성, 고차 함수 등 함수형 프로그래밍의 핵심 개념을 정리했습니다.',
    author: { username: 'FP러버' },
    createdAt: '2025-01-30',
  },
  {
    id: 17,
    title: 'CI/CD 파이프라인 구축',
    content: 'GitHub Actions를 활용한 자동화된 배포 프로세스 구축 경험을 공유합니다.',
    author: { username: '데브옵스' },
    createdAt: '2025-01-31',
  },
  {
    id: 18,
    title: 'GraphQL vs REST',
    content: '두 API 패러다임의 차이점과 각각이 빛나는 상황을 비교 분석합니다.',
    author: { username: 'API설계자' },
    createdAt: '2025-02-01',
  },
  {
    id: 19,
    title: '모바일 반응형 디자인',
    content: 'Mobile First 접근법과 미디어 쿼리 활용 노하우를 공유합니다.',
    author: { username: 'UI디자이너' },
    createdAt: '2025-02-02',
  },
  {
    id: 20,
    title: '마이크로서비스 아키텍처',
    content: '모놀리식에서 마이크로서비스로 전환한 실제 경험담을 나눕니다.',
    author: { username: '아키텍트' },
    createdAt: '2025-02-03',
  },
];

const PostListPage = () => {
  const { isAuthenticated } = useAuth();
  const [posts] = useState(dummyPosts);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 9;

  // 페이지네이션 계산
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);

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

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 섹션 */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-3">
            게시글 모아보기
          </h1>
          <p className="text-slate-600 text-lg">
            다양한 이야기를 자유롭게 공유하는 공간입니다
          </p>
        </div>

        {/* 새 글 작성 버튼 (모바일 포함) */}
        {isAuthenticated && (
          <div className="mb-8 flex justify-center">
            <Link
              to="/posts/new"
              className="button-hover inline-flex items-center bg-white text-slate-700 px-8 py-4 rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl border-2 border-slate-200"
            >
              <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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

        {/* 그리드 레이아웃 - Padlet 스타일 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentPosts.map((post) => (
            <Link
              key={post.id}
              to={`/posts/${post.id}`}
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
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {post.content}
                </p>

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

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center space-x-2">
            {/* 이전 페이지 버튼 */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="button-hover px-4 py-2 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 shadow-sm"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
                {getPageNumbers()[0] > 2 && (
                  <span className="text-slate-400 px-2">...</span>
                )}
              </>
            )}

            {/* 페이지 번호들 */}
            {getPageNumbers().map((pageNumber) => (
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
              <svg
                className="w-5 h-5"
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
            </button>
          </div>
        )}

        {/* 페이지 정보 */}
        {posts.length > 0 && (
          <div className="mt-6 text-center text-sm text-slate-600">
            전체 {posts.length}개 중 {indexOfFirstPost + 1}-
            {Math.min(indexOfLastPost, posts.length)}번째 게시글
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
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                아직 게시글이 없어요
              </h3>
              <p className="text-gray-600 mb-6">
                첫 번째 게시글을 작성해보세요!
              </p>
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
