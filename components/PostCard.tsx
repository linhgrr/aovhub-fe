import React, { useState } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { LikesModal } from './LikesModal';

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
  showAuthor?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onOpenComments,
  onShare,
  showAuthor = true,
}) => {
  const [showLikesModal, setShowLikesModal] = useState(false);

  return (
    <>
      <LikesModal
        postId={post.id}
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        totalCount={post.like_count}
      />
      <div className="bg-bg-secondary rounded-[10px] md:rounded-[12px] overflow-hidden mb-4 md:mb-6 border border-white/5">
        {/* Header - Responsive */}
        <div className="p-4 md:p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <a href={`#profile/${post.author.id}`}>
              <img
                src={post.author.avatar_url || '/assets/images/home.svg'}
                alt=""
                className="w-[32px] h-[32px] md:w-[38px] md:h-[38px] rounded-[8px] md:rounded-[10px] object-cover"
              />
            </a>
            <div>
              <div className="flex items-center gap-1.5">
                <a href={`#profile/${post.author.id}`} className="font-montserrat font-semibold text-white text-[12px] md:text-[14px] hover:text-primary transition-colors">
                  {post.author.username}
                </a>
                {post.shared_post && (
                  <span className="text-[#7f7f7f] text-[10px] md:text-[11px]">đã chia sẻ bài viết</span>
                )}
              </div>
              <span className="text-[#7f7f7f] text-[9px] md:text-[10px] uppercase">Công khai</span>
            </div>
          </div>

        </div>

        {/* Caption - shown before media for both regular and shared posts */}
        {post.content && (
          <div className="px-4 md:px-6 pb-3">
            <p className="text-white/90 text-[11px] md:text-[12px] leading-relaxed">
              {post.content}
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
                  src={post.shared_post.author.avatar_url || '/assets/images/home.svg'}
                  alt=""
                  className="w-[28px] h-[28px] md:w-[32px] md:h-[32px] rounded-[6px] md:rounded-[8px] object-cover"
                />
              </a>
              <div>
                <a href={`#profile/${post.shared_post.author.id}`} className="font-montserrat font-semibold text-white text-[11px] md:text-[12px] block hover:text-primary transition-colors">
                  {post.shared_post.author.username}
                </a>
                <span className="text-[#7f7f7f] text-[8px] md:text-[9px]">
                  {new Date(post.shared_post.created_at).toLocaleDateString('vi-VN')}
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
                <p className="text-white/70 text-[10px] md:text-[11px] leading-relaxed line-clamp-3">
                  {post.shared_post.content}
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
              className={`transition-all hover:scale-110 ${post.is_liked ? '' : 'opacity-60 hover:opacity-100'}`}
            >
              <img
                src={post.is_liked ? "/assets/images/heart-filled.svg" : "/assets/images/heart.svg"}
                alt="Like"
                className={`w-[18px] h-[18px] md:w-5 md:h-5 transition-all ${post.is_liked ? 'brightness-110 drop-shadow-[0_0_8px_rgba(140,103,246,0.8)]' : 'filter-primary'}`}
              />
            </button>
            <button
              onClick={() => onOpenComments(post)}
              className="opacity-60 hover:opacity-100 transition-all hover:scale-110"
            >
              <img
                src="/assets/images/chat.svg"
                alt="Comment"
                className="w-[18px] h-[18px] md:w-5 md:h-5 filter-primary"
              />
            </button>
            <button
              onClick={() => onShare?.(post)}
              className="opacity-60 hover:opacity-100 transition-all hover:scale-110"
            >
              <img
                src="/assets/images/send.svg"
                alt="Share"
                className="w-[18px] h-[18px] md:w-5 md:h-5 filter-primary"
              />
            </button>
          </div>

          <button className="opacity-60 hover:opacity-100 transition-all">
            <svg className="w-[18px] h-[18px] md:w-5 md:h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>

        {/* Stats and Content - Responsive */}
        <div className="px-4 md:px-6 pb-4 md:pb-6">
          {/* Clickable Likes Section - Only show if there are likes */}
          {post.like_count > 0 && (
            <button
              onClick={() => setShowLikesModal(true)}
              className="flex items-center gap-2 mb-2 md:mb-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              {/* Show real avatars of recent likers */}
              {post.recent_likers && post.recent_likers.length > 0 && (
                <div className="flex -space-x-2">
                  {post.recent_likers.slice(0, 3).map((liker) => (
                    <img
                      key={liker.id}
                      src={liker.avatar_url || '/assets/images/home.svg'}
                      alt={liker.username}
                      className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-bg-secondary object-cover"
                    />
                  ))}
                </div>
              )}
              <p className="text-white/80 text-[11px] md:text-[13px] text-left">
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
          )}


          {/* Post Comment Input - Click opens comment modal - Responsive */}
          <div
            className="flex items-center gap-2 md:gap-3 pt-3 md:pt-4 border-t border-white/5 cursor-pointer group"
            onClick={() => onOpenComments(post)}
          >
            <img
              src={post.author.avatar_url || '/assets/images/home.svg'}
              alt=""
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
