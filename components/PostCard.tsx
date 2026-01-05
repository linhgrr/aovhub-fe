import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Trash2, AlertTriangle, Edit3 } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { LikesModal } from './LikesModal';
import { HashtagText } from './HashtagText';
import { formatTimeAgo, formatDate } from '../utils/timeUtils';
import { getAvatarUrl } from '../utils/avatarUtils';
import { API_BASE_URL } from '../constants';
import { useSnackbar } from '../contexts/SnackbarContext';

// Types matching backend
export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  thumbnail_url?: string;
}

export interface PostAuthor {
  id: string;
  username: string;
  avatar_url: string | null;
  rank: string | null;
  level: number | null;
}

export interface SharedPostInfo {
  id: string;
  author: PostAuthor;
  content: string;
  media: MediaItem[];
  created_at: string;
}

export interface RecentLiker {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface FeedPost {
  id: string;
  author_id: string;
  author: PostAuthor;
  content: string;
  media: MediaItem[];
  like_count: number;
  comment_count: number;
  share_count: number;
  is_liked: boolean;
  shared_post: SharedPostInfo | null;
  recent_likers?: RecentLiker[];  // Optional for backward compatibility
  created_at: string;
}

interface PostCardProps {
  post: FeedPost;
  onLike: (postId: string, isLiked: boolean) => void;
  onOpenComments: (post: FeedPost) => void;
  onShare?: (post: FeedPost) => void;
  onDelete?: (postId: string) => void;
  onEdit?: (post: FeedPost) => void;
  currentUserId?: string;
  showAuthor?: boolean;
  token?: string;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onOpenComments,
  onShare,
  onDelete,
  onEdit,
  currentUserId,
  showAuthor = true,
  token,
}) => {
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { showSuccess, showError } = useSnackbar();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleDeleteClick = () => {
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const handleEditClick = () => {
    setShowMenu(false);
    onEdit?.(post);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete?.(post.id);
  };

  const handleReportClick = () => {
    setShowMenu(false);
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (reportReason.length < 10 || !token) return;
    try {
      setIsReporting(true);
      const response = await fetch(`${API_BASE_URL}/forum/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          target_type: 'POST',
          target_id: post.id,
          reason: reportReason,
        }),
      });
      if (!response.ok) throw new Error('Không thể gửi báo cáo');
      showSuccess('Báo cáo đã được gửi thành công!');
      setShowReportModal(false);
      setReportReason('');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Không thể gửi báo cáo');
    } finally {
      setIsReporting(false);
    }
  };

  const isOwnPost = currentUserId && post.author_id === currentUserId;

  return (
    <>
      <LikesModal
        postId={post.id}
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        totalCount={post.like_count}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-bg-secondary rounded-[16px] border border-white/10 p-6 max-w-[320px] w-full animate-in zoom-in-95 fade-in duration-200">
            <h3 className="text-white font-bold text-[16px] mb-2">Xóa bài viết?</h3>
            <p className="text-white/60 text-[13px] mb-5">
              Bạn có chắc muốn xóa bài viết này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-[10px] bg-white/10 text-white text-[13px] font-semibold hover:bg-white/20 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-[10px] bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => { setShowReportModal(false); setReportReason(''); }}
          />
          <div className="relative bg-bg-secondary rounded-[16px] border border-white/10 p-6 max-w-[360px] w-full animate-in zoom-in-95 fade-in duration-200">
            <h3 className="text-white font-bold text-[16px] mb-2 flex items-center gap-2">
              <AlertTriangle className="text-yellow-400" size={20} />
              Báo cáo bài viết
            </h3>
            <p className="text-white/60 text-[13px] mb-4">
              Nội dung này vi phạm quy định cộng đồng? Hãy cho chúng tôi biết lý do.
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Nhập lý do báo cáo (ít nhất 10 ký tự)..."
              rows={3}
              className="w-full px-4 py-3 bg-bg-main/50 border border-white/10 rounded-[10px] 
                         text-white text-[13px] placeholder:text-white/30 focus:outline-none 
                         focus:border-yellow-500/50 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowReportModal(false); setReportReason(''); }}
                className="flex-1 py-2.5 rounded-[10px] bg-white/10 text-white text-[13px] font-semibold hover:bg-white/20 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={isReporting || reportReason.length < 10}
                className="flex-1 py-2.5 rounded-[10px] bg-yellow-500 text-slate-900 text-[13px] font-semibold 
                           hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReporting ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-bg-secondary rounded-[10px] md:rounded-[12px] overflow-hidden mb-4 md:mb-6 border border-white/5">
        {/* Header - Responsive */}
        <div className="p-4 md:p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <a href={`#profile/${post.author.id}`}>
              <img
                src={getAvatarUrl(post.author.avatar_url, post.author.username)}
                alt={post.author.username}
                className="w-[32px] h-[32px] md:w-[38px] md:h-[38px] rounded-[8px] md:rounded-[10px] object-cover"
              />
            </a>
            <div>
              <div className="flex items-center gap-1.5">
                <a href={`#profile/${post.author.id}`} className="font-montserrat font-semibold text-white text-[13px] md:text-[15px] hover:text-primary transition-colors">
                  {post.author.username}
                </a>
                {post.shared_post && (
                  <span className="text-[#7f7f7f] text-[10px] md:text-[11px]">đã chia sẻ bài viết</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#7f7f7f] text-[9px] md:text-[10px]">{formatTimeAgo(post.created_at)}</span>
              </div>
            </div>
          </div>

          {/* 3-dot menu - show for logged-in users */}
          {currentUserId && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all"
              >
                <MoreVertical size={18} />
              </button>

              {/* Dropdown menu */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-bg-secondary border border-white/10 rounded-[10px] shadow-xl overflow-hidden z-50 min-w-[150px] animate-in fade-in zoom-in-95 duration-150">
                  {/* Report option - only for other users' posts */}
                  {!isOwnPost && (
                    <button
                      onClick={handleReportClick}
                      className="w-full px-4 py-2.5 flex items-center gap-2 text-yellow-400 hover:bg-white/5 transition-colors text-[13px]"
                    >
                      <AlertTriangle size={16} />
                      Báo cáo
                    </button>
                  )}
                  {/* Edit option - only for own posts without shared content */}
                  {isOwnPost && onEdit && !post.shared_post && (
                    <button
                      onClick={handleEditClick}
                      className="w-full px-4 py-2.5 flex items-center gap-2 text-primary hover:bg-white/5 transition-colors text-[13px]"
                    >
                      <Edit3 size={16} />
                      Chỉnh sửa
                    </button>
                  )}
                  {/* Delete option - only for own posts */}
                  {isOwnPost && onDelete && (
                    <button
                      onClick={handleDeleteClick}
                      className="w-full px-4 py-2.5 flex items-center gap-2 text-red-400 hover:bg-white/5 transition-colors text-[13px]"
                    >
                      <Trash2 size={16} />
                      Xóa bài viết
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Caption - shown before media for both regular and shared posts */}
        {post.content && (
          <div className="px-4 md:px-6 pb-3">
            <p className="text-white/90 text-[13px] md:text-[15px] leading-relaxed">
              <HashtagText content={post.content} />
            </p>
          </div>
        )}

        {/* Shared Post Content */}
        {post.shared_post && (
          <div className="mx-4 md:mx-6 mb-3 md:mb-4 border border-white/10 rounded-[10px] md:rounded-[12px] overflow-hidden bg-bg-main/30">
            {/* Shared Post Header */}
            <div className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
              <a href={`#profile/${post.shared_post.author.id}`}>
                <img
                  src={getAvatarUrl(post.shared_post.author.avatar_url, post.shared_post.author.username)}
                  alt={post.shared_post.author.username}
                  className="w-[28px] h-[28px] md:w-[32px] md:h-[32px] rounded-[6px] md:rounded-[8px] object-cover"
                />
              </a>
              <div>
                <a href={`#profile/${post.shared_post.author.id}`} className="font-montserrat font-semibold text-white text-[12px] md:text-[14px] block hover:text-primary transition-colors">
                  {post.shared_post.author.username}
                </a>
                <span className="text-[#7f7f7f] text-[10px] md:text-[11px]">
                  {formatDate(post.shared_post.created_at)}
                </span>
              </div>
            </div>

            {/* Shared Post Media */}
            {post.shared_post.media && post.shared_post.media.length > 0 && (
              <div className="px-3 md:px-4 pb-3 md:pb-4">
                <div className={`grid gap-1.5 ${post.shared_post.media.length === 1 ? 'grid-cols-1' :
                  post.shared_post.media.length === 2 ? 'grid-cols-2' :
                    'grid-cols-2 md:grid-cols-3'
                  }`}>
                  {post.shared_post.media.map((item, index) => (
                    <div
                      key={index}
                      className={`relative rounded-[8px] md:rounded-[10px] overflow-hidden group bg-black/20 ${post.shared_post!.media.length === 1 ? 'flex justify-center items-center bg-black' : 'aspect-square'
                        }`}
                    >
                      {item.type === 'image' ? (
                        <img
                          src={item.url}
                          alt="Shared content"
                          className={`${post.shared_post!.media.length === 1
                            ? 'max-h-[80vh] w-auto max-w-full object-contain'
                            : 'w-full h-full object-cover'} cursor-pointer`}
                          onClick={() => onOpenComments(post)}
                        />
                      ) : (
                        <VideoPlayer
                          src={item.url}
                          poster={item.thumbnail_url}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shared Post Content */}
            {post.shared_post.content && (
              <div className="px-3 md:px-4 pb-3 md:pb-4">
                <p className="text-white/70 text-[12px] md:text-[14px] leading-relaxed line-clamp-3">
                  <HashtagText content={post.shared_post.content} />
                </p>
              </div>
            )}
          </div>
        )}

        {/* Original Media Content (only show if NOT a shared post) */}
        {!post.shared_post && post.media && post.media.length > 0 && (
          <div className="px-4 md:px-6 pb-3 md:pb-4">
            <div className={`grid gap-2 ${post.media.length === 1 ? 'grid-cols-1' :
              post.media.length === 2 ? 'grid-cols-2' :
                'grid-cols-2 md:grid-cols-3'
              }`}>
              {post.media.map((item, index) => (
                <div
                  key={index}
                  className={`relative rounded-[10px] md:rounded-[12px] overflow-hidden group bg-black/20 ${post.media.length === 1 ? 'flex justify-center items-center bg-black' : 'aspect-square'
                    }`}
                >
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={`Content ${index + 1}`}
                      className={`${post.media.length === 1
                        ? 'max-h-[65vh] w-auto max-w-full object-contain'
                        : 'w-full h-full object-cover'} transition-transform duration-500 group-hover:scale-105 cursor-pointer`}
                      onClick={() => onOpenComments(post)}
                    />
                  ) : (
                    <VideoPlayer
                      src={item.url}
                      poster={item.thumbnail_url}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactions - Responsive */}
        <div className="px-4 md:px-6 pb-3 md:pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-5">
            <button
              onClick={() => onLike(post.id, post.is_liked)}
              className={`transition-all hover:scale-110 ${post.is_liked ? '' : 'opacity-100 hover:opacity-100'}`}
            >
              <img
                src={post.is_liked ? "/assets/images/heart-filled.svg" : "/assets/images/heart.svg"}
                alt="Like"
                className={`w-[18px] h-[18px] md:w-5 md:h-5 transition-all ${post.is_liked ? 'brightness-110 drop-shadow-[0_0_8px_rgba(140,103,246,0.8)]' : 'filter-primary'}`}
              />
            </button>
            <button
              onClick={() => onOpenComments(post)}
              className="opacity-100 hover:opacity-100 transition-all hover:scale-110"
            >
              <img
                src="/assets/images/chat.svg"
                alt="Comment"
                className="w-[18px] h-[18px] md:w-5 md:h-5 filter-primary"
              />
            </button>
            <button
              onClick={() => onShare?.(post)}
              className="opacity-100 hover:opacity-100 transition-all hover:scale-110"
            >
              <img
                src="/assets/images/send.svg"
                alt="Share"
                className="w-[18px] h-[18px] md:w-5 md:h-5 filter-primary"
              />
            </button>
          </div>

          {/* <button className="opacity-60 hover:opacity-100 transition-all">
            <svg className="w-[18px] h-[18px] md:w-5 md:h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button> */}
        </div>

        {/* Stats and Content - Responsive */}
        <div className="px-4 md:px-6 pb-4 md:pb-6">
          {/* Stats Line - Likes on left, Comments and Shares on right */}
          {(post.like_count > 0 || post.comment_count > 0 || post.share_count > 0) && (
            <div className="flex items-center justify-between mb-2 md:mb-3">
              {/* Clickable Likes Section - Only show if there are likes */}
              {post.like_count > 0 ? (
                <button
                  onClick={() => setShowLikesModal(true)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  {/* Show real avatars of recent likers */}
                  {post.recent_likers && post.recent_likers.length > 0 && (
                    <div className="flex -space-x-2">
                      {post.recent_likers.slice(0, 3).map((liker) => (
                        <img
                          key={liker.id}
                          src={getAvatarUrl(liker.avatar_url, liker.username)}
                          alt={liker.username}
                          className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-bg-secondary object-cover"
                        />
                      ))}
                    </div>
                  )}
                  <p className="text-white/80 text-[12px] md:text-[14px] text-left">
                    {post.recent_likers && post.recent_likers.length > 0 ? (
                      <>
                        <span className="font-semibold">{post.recent_likers[0].username}</span> đã thích
                        {post.like_count > 1 && (
                          <> cùng <span className="font-semibold">{post.like_count - 1} người khác</span></>
                        )}
                      </>
                    ) : (
                      <><span className="font-semibold">{post.like_count}</span> người thích</>
                    )}
                  </p>
                </button>
              ) : (
                <div></div>
              )}

              {/* Comment and Share counts on the right */}
              {(post.comment_count > 0 || post.share_count > 0) && (
                <div className="flex items-center gap-3 md:gap-4 text-white/60 text-[12px] md:text-[14px]">
                  {post.comment_count > 0 && (
                    <span className="hover:text-white/80 transition-colors cursor-pointer" onClick={() => onOpenComments(post)}>
                      {post.comment_count} bình luận
                    </span>
                  )}
                  {post.share_count > 0 && (
                    <span>
                      {post.share_count} lượt chia sẻ
                    </span>
                  )}
                </div>
              )}
            </div>
          )}


          {/* Post Comment Input - Click opens comment modal - Responsive */}
          <div
            className="flex items-center gap-2 md:gap-3 pt-3 md:pt-4 border-t border-white/5 cursor-pointer group"
            onClick={() => onOpenComments(post)}
          >
            <img
              src={getAvatarUrl(post.author.avatar_url, post.author.username)}
              alt={post.author.username}
              className="w-8 h-8 md:w-10 md:h-10 rounded-[8px] md:rounded-[10px] object-cover"
            />
            <div className="flex-1 relative">
              <div className="w-full bg-bg-main/50 h-9 md:h-10 rounded-[8px] md:rounded-[10px] px-3 md:px-4 text-[10px] md:text-[11px] text-[#a5a5a5] flex items-center group-hover:bg-bg-main/70 transition-colors">
                Viết bình luận..
              </div>
              <div className="absolute right-1 md:right-1.5 top-1 md:top-1.5 h-6 md:h-7 px-3 md:px-4 rounded-[6px] text-[10px] md:text-[11px] font-semibold bg-primary/20 text-white/40 flex items-center">
                Đăng
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PostCard;
