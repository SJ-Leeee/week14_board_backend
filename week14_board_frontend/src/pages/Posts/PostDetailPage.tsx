/**
 * 게시글 상세 페이지
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getPost } from '../../api/posts.api';
import { getComments, createComment } from '../../api/comments.api';
import { useAuth } from '../../context/AuthContext';
import type { Post, Comment } from '../../types';

const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  // 게시글 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const [postData, commentsData] = await Promise.all([getPost(id), getComments(id)]);
        setPost(postData);
        setComments(commentsData);
      } catch (err) {
        toast.error('게시글을 불러오는데 실패했습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // 댓글 작성
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentContent.trim()) return;

    try {
      setCommentLoading(true);
      const newComment = await createComment(id, { content: commentContent });
      setComments([...comments, newComment]);
      setCommentContent('');
      toast.success('댓글이 작성되었습니다.');
    } catch (err) {
      toast.error('댓글 작성에 실패했습니다.');
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-600">게시글을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 게시글 내용 */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900 text-sm flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            목록으로
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>

        <div className="flex items-center text-sm text-gray-500 mb-6 pb-6 border-b">
          <span className="font-medium text-gray-700">{post.author.username}</span>
          <span className="mx-2">·</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>

        <div className="prose max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
        </div>
      </div>

      {/* 댓글 섹션 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          댓글 <span className="text-jungle">{comments.length}</span>
        </h2>

        {/* 댓글 작성 폼 */}
        {isAuthenticated ? (
          <form onSubmit={handleSubmitComment} className="mb-6">
            <textarea
              value={commentContent}
              onChange={e => setCommentContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-jungle focus:border-jungle"
              rows={3}
              placeholder="댓글을 작성하세요"
              required
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={commentLoading || !commentContent.trim()}
                className="px-4 py-2 bg-jungle text-white rounded-md hover:bg-jungle-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {commentLoading ? '작성 중...' : '댓글 작성'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 rounded-md text-center">
            <p className="text-gray-600">
              댓글을 작성하려면{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-jungle font-medium hover:underline"
              >
                로그인
              </button>
              이 필요합니다.
            </p>
          </div>
        )}

        {/* 댓글 목록 */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">첫 댓글을 작성해보세요!</p>
          ) : (
            comments.map(comment => (
              <div key={comment._id} className="border-t pt-4">
                <div className="flex items-center mb-2">
                  <span className="font-medium text-gray-900">{comment.author.username}</span>
                  <span className="mx-2 text-gray-400">·</span>
                  <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
