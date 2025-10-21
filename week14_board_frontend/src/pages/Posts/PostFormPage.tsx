/**
 * 게시글 작성/수정 페이지
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createPost } from '../../api/posts.api';

const PostFormPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createPost(formData);
      toast.success('게시물 등록이 완료되었습니다.');
      navigate('/');
    } catch (err) {
      toast.error('게시물 등록에 실패했습니다. 다시 시도해주세요.');
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">게시글 작성</h1>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            제목
          </label>
          <input
            id="title"
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-jungle focus:border-jungle"
            placeholder="제목을 입력하세요"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            내용
          </label>
          <textarea
            id="content"
            required
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-jungle focus:border-jungle"
            placeholder="내용을 입력하세요"
            value={formData.content}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            onClick={() => navigate('/')}
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-jungle text-white rounded-md hover:bg-jungle-dark"
          >
            작성하기
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostFormPage;
