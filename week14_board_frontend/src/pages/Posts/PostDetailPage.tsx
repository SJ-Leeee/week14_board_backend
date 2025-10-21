/**
 * 게시글 상세 페이지
 */

const PostDetailPage = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">게시글 제목</h1>
        <div className="border-t border-gray-200 pt-4">
          <p className="text-gray-700">게시글 내용이 표시됩니다.</p>
        </div>
      </div>

      {/* 댓글 섹션 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">댓글</h2>
        <p className="text-gray-500 text-center py-4">댓글 기능이 곧 추가됩니다.</p>
      </div>
    </div>
  );
};

export default PostDetailPage;
