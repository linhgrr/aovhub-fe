import React, { useState } from 'react';
import { X, Share2, Loader2, Send } from 'lucide-react';
import { FeedPost } from './PostCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Format timestamp
const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return date.toLocaleDateString('vi-VN');
};

interface SharePostModalProps {
  post: FeedPost;
  isOpen: boolean;
  onClose: () => void;
  onShareComplete: (newPost: FeedPost) => void;
  token: string | null;
}

export const SharePostModal: React.FC<SharePostModalProps> = ({
  post,
  isOpen,
  onClose,
  onShareComplete,
  token,
}) => {
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Get the post to display (original if this is already a share)
  const displayPost = post.shared_post || post;

  const handleShare = async () => {
    if (!token) return;
    
    setIsSubmitting(true);
    try {
      // If sharing a shared post, we need to share the original
      const postIdToShare = post.shared_post ? post.shared_post.id : post.id;
      
      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: caption.trim(),
          media: [],
          shared_post_id: postIdToShare,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onShareComplete(data.data);
        onClose();
        setCaption('');
      }
    } catch (err) {
      console.error('Share failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-bg-secondary w-full max-w-lg rounded-[20px] border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-[18px] font-bakbak text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share post
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Caption Input */}
        <div className="p-5">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Bạn muốn nói gì về bài viết này?"
            className="w-full bg-bg-main/50 border border-white/5 rounded-[12px] p-4 text-white text-[14px] md:text-[15px] placeholder-white/30 resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all min-h-[100px]"
            rows={3}
            autoFocus
          />
        </div>

        {/* Post Preview */}
        <div className="px-5 pb-5">
          <div className="border border-white/10 rounded-[16px] overflow-hidden bg-bg-main/30">
            {/* Original Author Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/5">
              <img 
                src={displayPost.author.avatar_url || '/assets/images/home.svg'} 
                alt={displayPost.author.username}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white/5"
              />
              <div>
                <p className="font-montserrat font-bold text-white text-[13px]">{displayPost.author.username}</p>
                <p className="text-[11px] text-white/40 uppercase tracking-wider">{formatTime(displayPost.created_at)}</p>
              </div>
            </div>
            
            {/* Post Content */}
            {displayPost.content && (
              <div className="p-4 text-white/80 text-[13px] leading-relaxed">
                {displayPost.content.length > 200 
                  ? displayPost.content.slice(0, 200) + '...' 
                  : displayPost.content
                }
              </div>
            )}
            
            {/* Media Preview */}
            {displayPost.media && displayPost.media.length > 0 && (
              <div className="px-4 pb-4">
                <div className={`grid gap-1.5 ${
                  displayPost.media.length === 1 ? 'grid-cols-1' : 
                  displayPost.media.length === 2 ? 'grid-cols-2' : 
                  'grid-cols-2'
                }`}>
                  {displayPost.media.map((item, index) => (
                      <div 
                        key={index} 
                        className={`relative rounded-[12px] overflow-hidden border border-white/5 bg-black/20 ${
                          displayPost.media.length === 1 ? 'aspect-video' : 'aspect-square'
                        }`}
                      >
                        {item.type === 'image' ? (
                          <img 
                            src={item.url} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="relative w-full h-full bg-black flex items-center justify-center">
                            <video 
                              src={item.url} 
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <Share2 className="w-6 h-6 text-white opacity-50" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-white/5 bg-bg-main/20 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-5 py-3 rounded-[12px] bg-white/5 text-white font-bold text-[14px] hover:bg-white/10 transition-all disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleShare}
            disabled={isSubmitting}
            className="flex-[2] flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-[12px] shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <span>Chia sẻ ngay</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharePostModal;
