import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, Trash2, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { useAuth } from '../contexts/authContext';
import { VideoPlayer } from './VideoPlayer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Types
interface MediaItem {
  url: string;
  type: 'image' | 'video';
  thumbnail_url?: string;
}

interface PostAuthor {
  id: string;
  username: string;
  avatar_url: string | null;
  rank: string | null;
  level: number | null;
}

interface FeedPost {
  id: string;
  author_id: string;
  author: PostAuthor;
  content: string;
  media: MediaItem[];
  like_count: number;
  comment_count: number;
  is_liked: boolean;
  created_at: string;
}

interface CommentAuthor {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author: CommentAuthor;
  content: string;
  mentions: string[];
  parent_id: string | null;
  reply_to_user_id: string | null;
  reply_to_username: string | null;
  like_count: number;
  reply_count: number;
  is_liked: boolean;
  created_at: string;
}

interface FriendForMention {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface PostDetailModalProps {
  post: FeedPost;
  isOpen: boolean;
  onClose: () => void;
  onPostUpdate?: (post: FeedPost) => void;
}

// Fullscreen Media Viewer Component
interface FullscreenMediaViewerProps {
  media: MediaItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const FullscreenMediaViewer: React.FC<FullscreenMediaViewerProps> = ({
  media,
  currentIndex,
  onClose,
  onNavigate,
}) => {
  const currentMedia = media[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < media.length - 1) {
        onNavigate(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [currentIndex, media.length, onClose, onNavigate]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 animate-in fade-in">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Navigation - Previous */}
      {currentIndex > 0 && (
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          className="absolute left-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-7 h-7 text-white" />
        </button>
      )}

      {/* Navigation - Next */}
      {currentIndex < media.length - 1 && (
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          className="absolute right-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronRight className="w-7 h-7 text-white" />
        </button>
      )}

      {/* Media Content */}
      <div className="w-full h-full flex items-center justify-center p-12" onClick={onClose}>
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-[70vw] h-[80vh] flex items-center justify-center"
        >
          {currentMedia.type === 'image' ? (
            <img
              src={currentMedia.url}
              alt=""
              className="w-full max-h-full object-contain rounded-lg"
            />
          ) : (
            <video
              src={currentMedia.url}
              poster={currentMedia.thumbnail_url}
              controls
              autoPlay
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          )}
        </div>
      </div>

      {/* Indicator dots */}
      {media.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {media.map((_, index) => (
            <button
              key={index}
              onClick={() => onNavigate(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentIndex
                ? 'bg-primary w-6'
                : 'bg-white/40 hover:bg-white/60'
                }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Format timestamp
const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút`;
  if (diffHour < 24) return `${diffHour} giờ`;
  if (diffDay < 7) return `${diffDay} ngày`;
  return date.toLocaleDateString('vi-VN');
};

// Special hashtags that should be highlighted in yellow
const SPECIAL_HASHTAGS = ['happynewyear2026', 'nguyensontung'];

// Parse mentions and hashtags in content and return JSX with clickable mentions and highlighted hashtags
const renderContentWithMentions = (
  content: string,
  friends: FriendForMention[],
  userMapping: Map<string, string>
): React.ReactNode => {
  // Split by both mentions and hashtags
  const parts = content.split(/(@\w+|#\w+)/g);
  return parts.map((part, index) => {
    // Handle mentions
    if (part.startsWith('@')) {
      const username = part.slice(1);
      let userId = userMapping.get(username);
      if (!userId) {
        const mentionedUser = friends.find(f => f.username === username);
        userId = mentionedUser?.id;
      }
      const profileLink = userId ? `#profile/${userId}` : null;

      if (profileLink) {
        return (
          <a
            key={index}
            href={profileLink}
            className="text-primary hover:underline font-semibold"
          >
            {part}
          </a>
        );
      }
      return <span key={index} className="text-primary font-semibold">{part}</span>;
    }

    // Handle hashtags
    if (part.startsWith('#')) {
      const tag = part.slice(1).toLowerCase();
      const isSpecial = SPECIAL_HASHTAGS.includes(tag);

      if (isSpecial) {
        return (
          <span
            key={index}
            className="text-yellow-400 font-semibold hover:text-yellow-300 transition-colors cursor-pointer animate-pulse"
            style={{
              textShadow: '0 0 10px rgba(250, 204, 21, 0.5)',
            }}
          >
            {part}
          </span>
        );
      }

      // Regular hashtag
      return (
        <span
          key={index}
          className="text-primary hover:underline cursor-pointer"
        >
          {part}
        </span>
      );
    }

    return part;
  });
};

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  isOpen,
  onClose,
  onPostUpdate,
}) => {
  const { user, token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; username: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, Comment[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});

  const [localPost, setLocalPost] = useState(post);

  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [friends, setFriends] = useState<FriendForMention[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<FriendForMention[]>([]);
  const [userMapping, setUserMapping] = useState<Map<string, string>>(new Map());

  // Fullscreen media viewer state
  const [fullscreenMediaIndex, setFullscreenMediaIndex] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  useEffect(() => {
    if (isOpen && post.id) {
      fetchComments();
      fetchFriends();
    }
  }, [isOpen, post.id]);

  useEffect(() => {
    if (replyingTo && inputRef.current) {
      setCommentContent(`@${replyingTo.username} `);
      inputRef.current.focus();
    }
  }, [replyingTo]);

  useEffect(() => {
    if (mentionSearch) {
      const filtered = friends.filter(f =>
        f.username.toLowerCase().includes(mentionSearch.toLowerCase())
      );
      setFilteredFriends(filtered);
    } else {
      setFilteredFriends(friends);
    }
  }, [mentionSearch, friends]);

  const fetchComments = async () => {
    if (!token) return;
    setIsLoadingComments(true);
    try {
      const response = await fetch(`${API_URL}/posts/${post.id}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        const commentsData = result.data || [];
        setComments(commentsData);

        const newMapping = new Map(userMapping);
        commentsData.forEach((comment: Comment) => {
          if (comment.author?.username && comment.author?.id) {
            newMapping.set(comment.author.username, comment.author.id);
          }
        });
        setUserMapping(newMapping);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const fetchFriends = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/friends`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        const friendsData = result.data || [];
        setFriends(friendsData);

        const newMapping = new Map(userMapping);
        friendsData.forEach((friend: FriendForMention) => {
          if (friend.username && friend.id) {
            newMapping.set(friend.username, friend.id);
          }
        });
        setUserMapping(newMapping);
      }
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    }
  };

  const handleLikePost = async () => {
    if (!token) return;

    const method = localPost.is_liked ? 'DELETE' : 'POST';
    try {
      const response = await fetch(`${API_URL}/posts/${localPost.id}/like`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const updatedPost = { ...localPost, like_count: data.like_count, is_liked: data.is_liked };
        setLocalPost(updatedPost);
        if (onPostUpdate) {
          onPostUpdate(updatedPost);
        }
      }
    } catch (err) {
      console.error('Like post failed:', err);
    }
  };

  const fetchReplies = async (commentId: string) => {
    if (!token || loadingReplies[commentId]) return;

    setLoadingReplies(prev => ({ ...prev, [commentId]: true }));
    try {
      const response = await fetch(`${API_URL}/comments/${commentId}/replies`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        setExpandedReplies(prev => ({ ...prev, [commentId]: result.data || [] }));
      }
    } catch (err) {
      console.error('Failed to fetch replies:', err);
    } finally {
      setLoadingReplies(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const handleSubmitComment = async () => {
    if (!commentContent.trim() || !token || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const mentionMatches = commentContent.match(/@(\w+)/g) || [];
      const mentionedUsernames = mentionMatches.map(m => m.slice(1));
      const mentionedUserIds = friends
        .filter(f => mentionedUsernames.includes(f.username))
        .map(f => f.id);

      const body: any = {
        content: commentContent,
        mentions: mentionedUserIds,
      };

      if (replyingTo) {
        body.parent_id = replyingTo.commentId;
        const replyToUser = friends.find(f => f.username === replyingTo.username);
        if (replyToUser) {
          body.reply_to_user_id = replyToUser.id;
        }
      }

      const response = await fetch(`${API_URL}/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const result = await response.json();
        const newComment = result.data;

        if (replyingTo) {
          setExpandedReplies(prev => ({
            ...prev,
            [replyingTo.commentId]: [newComment, ...(prev[replyingTo.commentId] || [])],
          }));
          setComments(prev => prev.map(c =>
            c.id === replyingTo.commentId
              ? { ...c, reply_count: c.reply_count + 1 }
              : c
          ));
        } else {
          setComments(prev => [newComment, ...prev]);
        }

        if (onPostUpdate) {
          onPostUpdate({ ...post, comment_count: post.comment_count + 1 });
        }

        setCommentContent('');
        setReplyingTo(null);
      }
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean, isReply: boolean = false, parentId?: string) => {
    if (!token) return;

    const method = isLiked ? 'DELETE' : 'POST';
    try {
      const response = await fetch(`${API_URL}/comments/${commentId}/like`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();

        if (isReply && parentId) {
          setExpandedReplies(prev => ({
            ...prev,
            [parentId]: prev[parentId]?.map(c =>
              c.id === commentId
                ? { ...c, like_count: result.like_count, is_liked: result.is_liked }
                : c
            ) || [],
          }));
        } else {
          setComments(prev => prev.map(c =>
            c.id === commentId
              ? { ...c, like_count: result.like_count, is_liked: result.is_liked }
              : c
          ));
        }
      }
    } catch (err) {
      console.error('Failed to like comment:', err);
    }
  };

  const handleDeleteComment = async (commentId: string, isReply: boolean = false, parentId?: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        if (isReply && parentId) {
          setExpandedReplies(prev => ({
            ...prev,
            [parentId]: prev[parentId]?.filter(c => c.id !== commentId) || [],
          }));
          setComments(prev => prev.map(c =>
            c.id === parentId
              ? { ...c, reply_count: Math.max(0, c.reply_count - 1) }
              : c
          ));
        } else {
          const comment = comments.find(c => c.id === commentId);
          const deletedCount = 1 + (comment?.reply_count || 0);
          setComments(prev => prev.filter(c => c.id !== commentId));

          if (onPostUpdate) {
            onPostUpdate({ ...post, comment_count: Math.max(0, post.comment_count - deletedCount) });
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setCommentContent(value);

    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      if (!textAfterAt.includes(' ')) {
        setShowMentionDropdown(true);
        setMentionStartIndex(lastAtIndex);
        setMentionSearch(textAfterAt);
        return;
      }
    }

    setShowMentionDropdown(false);
    setMentionSearch('');
  };

  const handleSelectMention = (friend: FriendForMention) => {
    const beforeMention = commentContent.slice(0, mentionStartIndex);
    const afterMention = commentContent.slice(mentionStartIndex + mentionSearch.length + 1);
    setCommentContent(`${beforeMention}@${friend.username} ${afterMention}`);
    setShowMentionDropdown(false);
    setMentionSearch('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !showMentionDropdown) {
      e.preventDefault();
      handleSubmitComment();
    }
    if (e.key === 'Escape') {
      if (showMentionDropdown) {
        setShowMentionDropdown(false);
      } else if (replyingTo) {
        setReplyingTo(null);
        setCommentContent('');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-bg-secondary border border-white/5 rounded-[20px] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
          <div className="w-10" />
          <h2 className="text-[14px] font-montserrat font-bold text-white">Bài viết của {post.author.username}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-bg-main hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar" ref={commentsContainerRef}>
          {/* Post Content */}
          <div className="p-5 border-b border-white/5">
            {/* Author */}
            <div className="flex items-center gap-3 mb-4">
              <a href={`#profile/${post.author.id}`}>
                <img
                  src={post.author.avatar_url || '/assets/images/home.svg'}
                  alt={post.author.username}
                  className="w-[44px] h-[44px] rounded-[12px] object-cover"
                />
              </a>
              <div>
                <a href={`#profile/${post.author.id}`} className="font-montserrat font-semibold text-white text-[14px] hover:text-primary transition-colors">
                  {post.author.username}
                </a>
                <p className="text-[#7f7f7f] text-[11px]">{formatTime(post.created_at)}</p>
              </div>
            </div>

            {/* Content */}
            <p className="text-white/90 text-[13px] leading-relaxed mb-4 whitespace-pre-wrap">{renderContentWithMentions(post.content, friends, userMapping)}</p>

            {/* Media */}
            {post.media.length > 0 && (
              <div className={`grid gap-2 mb-4 ${post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {post.media.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-[12px] overflow-hidden relative group cursor-pointer"
                    onClick={() => setFullscreenMediaIndex(index)}
                  >
                    {item.type === 'image' ? (
                      <img src={item.url} alt="" className="w-full object-cover max-h-80" />
                    ) : (
                      <div className="relative">
                        <video
                          src={item.url}
                          poster={item.thumbnail_url}
                          className="w-full object-cover max-h-80"
                          muted
                        />
                        {/* Play icon overlay for video thumbnail */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Fullscreen hint overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                      <Maximize2 className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center justify-between text-[12px] text-[#7f7f7f] py-3 border-y border-white/5">
              <span>{localPost.like_count} lượt thích</span>
              <span>{localPost.comment_count} bình luận</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-around py-3">
              <button
                onClick={handleLikePost}
                className={`flex items-center gap-2 px-4 py-2 rounded-[10px] transition-all ${localPost.is_liked ? 'text-primary bg-primary/10' : 'text-[#7f7f7f] hover:bg-white/5'
                  }`}
              >
                <img
                  src={localPost.is_liked ? "/assets/images/heart-filled.svg" : "/assets/images/heart.svg"}
                  alt="Like"
                  className={`w-5 h-5 transition-all ${localPost.is_liked ? 'brightness-110 drop-shadow-[0_0_8px_rgba(140,103,246,0.8)]' : 'filter-primary'}`}
                />
                <span className="text-[12px] font-semibold">Thích</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[#7f7f7f] hover:bg-white/5 transition-colors">
                <img
                  src="/assets/images/chat.svg"
                  alt="Comment"
                  className="w-5 h-5 filter-primary"
                />
                <span className="text-[12px] font-semibold">Bình luận</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[#7f7f7f] hover:bg-white/5 transition-colors">
                <img
                  src="/assets/images/send.svg"
                  alt="Share"
                  className="w-5 h-5 filter-primary"
                />
                <span className="text-[12px] font-semibold">Chia sẻ</span>
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="p-5">
            {isLoadingComments ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-center text-[#7f7f7f] text-[12px] py-8">Chưa có bình luận nào</p>
            ) : (
              <div className="space-y-4">
                {comments.map(comment => (
                  <div key={comment.id}>
                    {/* Root Comment */}
                    <div className="flex gap-3">
                      <a href={`#profile/${comment.author.id}`}>
                        <img
                          src={comment.author.avatar_url || '/assets/images/home.svg'}
                          alt={comment.author.username}
                          className="w-[36px] h-[36px] rounded-[10px] object-cover"
                        />
                      </a>
                      <div className="flex-1">
                        <div className="bg-bg-main rounded-[12px] px-4 py-3 inline-block">
                          <a href={`#profile/${comment.author.id}`} className="font-montserrat font-semibold text-white text-[12px] hover:text-primary transition-colors">
                            {comment.author.username}
                          </a>
                          <p className="text-white/80 text-[12px] mt-1">
                            {renderContentWithMentions(comment.content, friends, userMapping)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 mt-2 ml-1 text-[11px]">
                          <span className="text-[#7f7f7f]">{formatTime(comment.created_at)}</span>
                          <button
                            onClick={() => handleLikeComment(comment.id, comment.is_liked)}
                            className={`font-semibold transition-colors ${comment.is_liked ? 'text-primary' : 'text-[#7f7f7f] hover:text-white'}`}
                          >
                            Thích {comment.like_count > 0 && `(${comment.like_count})`}
                          </button>
                          <button
                            onClick={() => setReplyingTo({ commentId: comment.id, username: comment.author.username })}
                            className="font-semibold text-[#7f7f7f] hover:text-white transition-colors"
                          >
                            Trả lời
                          </button>
                          {comment.author_id === user?.id && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-[#7f7f7f] hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Replies */}
                        {comment.reply_count > 0 && (
                          <div className="mt-3">
                            {!expandedReplies[comment.id] ? (
                              <button
                                onClick={() => fetchReplies(comment.id)}
                                className="text-[11px] text-primary hover:underline flex items-center gap-1"
                                disabled={loadingReplies[comment.id]}
                              >
                                {loadingReplies[comment.id] ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <>Xem {comment.reply_count} phản hồi</>
                                )}
                              </button>
                            ) : (
                              <div className="space-y-3 mt-3 pl-2 border-l-2 border-white/5">
                                {expandedReplies[comment.id]?.map(reply => (
                                  <div key={reply.id} className="flex gap-2">
                                    <a href={`#profile/${reply.author.id}`}>
                                      <img
                                        src={reply.author.avatar_url || '/assets/images/home.svg'}
                                        alt={reply.author.username}
                                        className="w-[28px] h-[28px] rounded-[8px] object-cover"
                                      />
                                    </a>
                                    <div className="flex-1">
                                      <div className="bg-bg-main rounded-[10px] px-3 py-2 inline-block">
                                        <a href={`#profile/${reply.author.id}`} className="font-montserrat font-semibold text-white text-[11px] hover:text-primary transition-colors">
                                          {reply.author.username}
                                        </a>
                                        <p className="text-white/80 text-[11px] mt-0.5">
                                          {renderContentWithMentions(reply.content, friends, userMapping)}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-3 mt-1.5 ml-1 text-[10px]">
                                        <span className="text-[#7f7f7f]">{formatTime(reply.created_at)}</span>
                                        <button
                                          onClick={() => handleLikeComment(reply.id, reply.is_liked, true, comment.id)}
                                          className={`font-semibold transition-colors ${reply.is_liked ? 'text-primary' : 'text-[#7f7f7f] hover:text-white'}`}
                                        >
                                          Thích {reply.like_count > 0 && `(${reply.like_count})`}
                                        </button>
                                        <button
                                          onClick={() => setReplyingTo({ commentId: comment.id, username: reply.author.username })}
                                          className="font-semibold text-[#7f7f7f] hover:text-white transition-colors"
                                        >
                                          Trả lời
                                        </button>
                                        {reply.author_id === user?.id && (
                                          <button
                                            onClick={() => handleDeleteComment(reply.id, true, comment.id)}
                                            className="text-[#7f7f7f] hover:text-red-400 transition-colors"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comment Input */}
        <div className="p-4 border-t border-white/5 shrink-0">
          {replyingTo && (
            <div className="flex items-center gap-2 mb-3 text-[11px] text-[#7f7f7f]">
              <span>Đang trả lời <span className="text-primary font-semibold">@{replyingTo.username}</span></span>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setCommentContent('');
                }}
                className="text-[#7f7f7f] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-3 relative">
            <img
              src={user?.avatar_url || '/assets/images/home.svg'}
              alt={user?.username}
              className="w-[36px] h-[36px] rounded-[10px] object-cover"
            />
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={commentContent}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={`Bình luận dưới tên ${user?.username}...`}
                className="w-full bg-bg-main rounded-[10px] px-4 py-3 text-white text-[12px] placeholder-[#7f7f7f] focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
              />

              {/* Mention Dropdown */}
              {showMentionDropdown && filteredFriends.length > 0 && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-bg-main border border-white/10 rounded-[12px] shadow-xl max-h-48 overflow-y-auto">
                  {filteredFriends.map(friend => (
                    <button
                      key={friend.id}
                      onClick={() => handleSelectMention(friend)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                    >
                      <img
                        src={friend.avatar_url || '/assets/images/home.svg'}
                        alt={friend.username}
                        className="w-[32px] h-[32px] rounded-[8px] object-cover"
                      />
                      <span className="text-white text-[12px] font-medium">{friend.username}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleSubmitComment}
              disabled={!commentContent.trim() || isSubmitting}
              className="w-[36px] h-[36px] flex items-center justify-center rounded-[10px] bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Media Viewer */}
      {fullscreenMediaIndex !== null && (
        <FullscreenMediaViewer
          media={post.media}
          currentIndex={fullscreenMediaIndex}
          onClose={() => setFullscreenMediaIndex(null)}
          onNavigate={setFullscreenMediaIndex}
        />
      )}
    </div>
  );
};

export default PostDetailModal;
