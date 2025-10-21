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
];

const PostListPage = () => {
  const { isAuthenticated } = useAuth();
  const [posts] = useState(dummyPosts);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 섹션 */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
            게시글 모아보기
          </h1>
          <p className="text-white/90 text-lg">
            다양한 이야기를 자유롭게 공유하는 공간입니다
          </p>
        </div>

        {/* 새 글 작성 버튼 (모바일 포함) */}
        {isAuthenticated && (
          <div className="mb-8 flex justify-center">
            <Link
              to="/posts/new"
              className="button-hover inline-flex items-center bg-white text-purple-600 px-8 py-4 rounded-2xl text-lg font-bold shadow-xl hover:shadow-2xl"
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
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/posts/${post.id}`}
              className="card-hover bg-white rounded-2xl shadow-lg overflow-hidden group"
            >
              {/* 카드 헤더 - 컬러풀한 그라데이션 */}
              <div className="h-3 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400"></div>

              {/* 카드 내용 */}
              <div className="p-6">
                {/* 제목 */}
                <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors line-clamp-2">
                  {post.title}
                </h2>

                {/* 본문 미리보기 */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {post.content}
                </p>

                {/* 메타 정보 */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                      {post.author.username.charAt(0)}
                    </div>
                    <span className="font-medium">{post.author.username}</span>
                  </div>
                  <span>{post.createdAt}</span>
                </div>
              </div>

              {/* 카드 푸터 - 호버 시 표시되는 액션 힌트 */}
              <div className="px-6 pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-purple-600 text-sm font-semibold flex items-center">
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

        {/* 빈 상태 메시지 */}
        {posts.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 max-w-md mx-auto shadow-xl">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-purple-500"
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
                  className="button-hover inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg"
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
