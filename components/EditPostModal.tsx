import React, { useState, useEffect } from 'react';
import { X, Loader2, Edit3 } from 'lucide-react';
import { FeedPost } from './PostCard';
import { useSnackbar } from '../contexts/SnackbarContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface EditPostModalProps {
  post: FeedPost;
  isOpen: boolean;
  onClose: () => void;
  onPostUpdated: (updatedPost: FeedPost) => void;
  token: string;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  post,
  isOpen,
  onClose,
  onPostUpdated,
  token,
}) => {
  const [content, setContent] = useState(post.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useSnackbar();

  // Reset content when post changes
  useEffect(() => {
    setContent(post.content);
  }, [post.content]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!content.trim()) {
      showError('Nội dung bài viết không được để trống');
      return;
    }

    if (content.trim() === post.content.trim()) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/posts/${post.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Không thể cập nhật bài viết');
      }

      const result = await response.json();
      onPostUpdated(result.data);
      showSuccess('Đã cập nhật bài viết thành công');
      onClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Không thể cập nhật bài viết');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[500px] bg-bg-secondary rounded-[16px] border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-white text-[16px] font-semibold flex items-center gap-2">
            <Edit3 size={18} className="text-primary" />
            Chỉnh sửa bài viết
          </h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-white/5 rounded-full text-white/60 hover:text-white transition-all disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Textarea */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Bạn đang nghĩ gì?"
            rows={5}
            maxLength={5000}
            autoFocus
            className="w-full px-4 py-3 bg-bg-main/50 border border-white/10 rounded-[12px] 
                       text-white text-[14px] placeholder:text-white/30 focus:outline-none 
                       focus:border-primary/50 resize-none transition-colors"
          />

          {/* Character count */}
          <div className="flex justify-end mt-2">
            <span className={`text-[12px] ${content.length > 4500 ? 'text-yellow-400' : 'text-white/40'}`}>
              {content.length}/5000
            </span>
          </div>

          {/* Media preview (read-only) */}
          {post.media && post.media.length > 0 && (
            <div className="mt-4">
              <p className="text-white/50 text-[12px] mb-2">Hình ảnh/Video (không thể chỉnh sửa)</p>
              <div className={`grid gap-2 ${
                post.media.length === 1 ? 'grid-cols-1' :
                post.media.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
              }`}>
                {post.media.slice(0, 3).map((item, index) => (
                  <div
                    key={index}
                    className="relative rounded-[8px] overflow-hidden aspect-square bg-black/20"
                  >
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt={`Media ${index + 1}`}
                        className="w-full h-full object-cover opacity-70"
                      />
                    ) : (
                      <video
                        src={item.url}
                        poster={item.thumbnail_url}
                        className="w-full h-full object-cover opacity-70"
                      />
                    )}
                    {index === 2 && post.media.length > 3 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-semibold">+{post.media.length - 3}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-white/5">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-[10px] bg-white/10 text-white text-[13px] font-semibold 
                       hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="px-5 py-2.5 rounded-[10px] bg-primary text-white text-[13px] font-semibold 
                       hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Đang lưu...
              </>
            ) : (
              'Lưu thay đổi'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;
