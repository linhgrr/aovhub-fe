import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, MessageCircle, CornerUpLeft, Eye, ImagePlus, X, ArrowLeft, Send, Loader2, AlertCircle, MessageSquare, Lock, MoreVertical, AlertTriangle } from 'lucide-react';
import {
  ForumThread, ForumComment, ForumCommentsResponse,
  ThreadStatus, ForumCommentStatus
} from '../types';
import { API_BASE_URL } from '../constants';
import { useAuth } from '../contexts/authContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { formatTimeAgo, formatFullDate } from '../utils/timeUtils';

interface ForumThreadPageProps {
  threadId: string;
}

// Comment component with modern design
const CommentItem: React.FC<{
  comment: ForumComment;
  onReply: (commentId: string, authorUsername: string) => void;
  onLike: (commentId: string) => void;
  onReport: (commentId: string) => void;
  isAuthenticated: boolean;
  currentUserId?: string;
  commentNumber?: number;
}> = ({ comment, onReply, onLike, onReport, isAuthenticated, currentUserId, commentNumber }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Handle snake_case from API
  const createdAt = comment.createdAt || (comment as any).created_at;
  const authorId = comment.author.id || (comment.author as any).id;

  // Use shared time utility
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    return formatTimeAgo(dateStr);
  };

  const isHidden = comment.status === ForumCommentStatus.HIDDEN ||
    comment.status === ForumCommentStatus.DELETED;

  const mediaUrls = comment.mediaUrls || (comment as any).media_urls || [];
  const quotedContent = (comment as any).quotedContent || (comment as any).quoted_content || null;
  const replyToUsername = comment.replyToUsername || (comment as any).reply_to_username;

  // Show report option only for other users' comments
  const canReport = isAuthenticated && currentUserId && authorId !== currentUserId;

  return (
    <div className={`bg-bg-secondary rounded-[16px] border border-white/5 overflow-hidden 
                     transition-all hover:border-white/10 ${isHidden ? 'opacity-60' : ''}`}>
      <div className="p-4 md:p-5">
        {/* Comment Header */}
        <div className="flex items-start gap-3 mb-3">
          <img
            src={comment.author.avatarUrl || (comment.author as any).avatar_url ||
              `https://ui-avatars.com/api/?name=${comment.author.username}&background=3b82f6&color=fff&size=96`}
            alt={comment.author.username}
            className="w-10 h-10 md:w-11 md:h-11 rounded-full object-cover ring-2 ring-white/5 
                       cursor-pointer hover:ring-primary/30 transition-all flex-shrink-0"
            onClick={() => window.location.hash = `profile/${comment.author.id}`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => window.location.hash = `profile/${comment.author.id}`}
                className="font-semibold text-white text-[13px] md:text-[14px] hover:text-primary 
                           transition-colors"
              >
                {comment.author.username}
              </button>
              {comment.author.rank && (
                <span className="text-[10px] px-2 py-0.5 bg-primary/20 text-primary 
                                 rounded-full font-medium">
                  {comment.author.rank}
                </span>
              )}
              <span className="text-white/30">•</span>
              <span className="text-white/40 text-[11px] md:text-[12px]">
                {formatDate(createdAt)}
              </span>
              {commentNumber && (
                <span className="text-white/20 text-[11px]">#{commentNumber}</span>
              )}
            </div>
          </div>

          {/* 3-dot menu for report */}
          {canReport && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all"
              >
                <MoreVertical size={16} />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-bg-secondary border border-white/10 
                                rounded-[10px] shadow-xl overflow-hidden z-50 min-w-[130px] 
                                animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => { setShowMenu(false); onReport(comment.id); }}
                    className="w-full px-3 py-2 flex items-center gap-2 text-yellow-400 
                               hover:bg-white/5 transition-colors text-[12px]"
                  >
                    <AlertTriangle size={14} />
                    Báo cáo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quote box for replies */}
        {replyToUsername && (
          <div className="bg-black/30 border-l-2 border-primary/50 px-4 py-3 mb-3 
                          rounded-r-[10px] ml-[52px] md:ml-[56px]">
            <div className="text-primary/80 text-[12px] font-medium mb-1">
              Trả lời @{replyToUsername}
            </div>
            {quotedContent && (
              <div className="text-white/40 text-[12px] line-clamp-2">
                {quotedContent}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="ml-[52px] md:ml-[56px]">
          <div className="text-white/90 text-[13px] md:text-[14px] leading-relaxed 
                          whitespace-pre-wrap break-words">
            {comment.content}
          </div>

          {/* Media */}
          {mediaUrls.length > 0 && !isHidden && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
              {mediaUrls.map((url: string, i: number) => (
                <div key={i} className="relative aspect-video rounded-[10px] overflow-hidden 
                                         bg-black/20 group">
                  <img
                    src={url}
                    alt="Attached"
                    className="w-full h-full object-cover transition-transform 
                               group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
            <button
              onClick={() => onLike(comment.id)}
              disabled={!isAuthenticated}
              className={`flex items-center gap-1.5 transition-all group/btn
                         ${comment.isLiked ? 'text-primary' : 'text-white/40 hover:text-primary'}
                         disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Heart
                className="w-4 h-4 group-hover/btn:scale-110 transition-transform"
                strokeWidth={1.5}
                fill={comment.isLiked ? 'currentColor' : 'none'}
              />
              {comment.likeCount > 0 && (
                <span className="text-[12px] font-medium">{comment.likeCount}</span>
              )}
            </button>

            {isAuthenticated && comment.status === ForumCommentStatus.ACTIVE && (
              <button
                onClick={() => onReply(comment.id, comment.author.username)}
                className="flex items-center gap-1.5 text-white/40 hover:text-blue-400 
                           transition-all group/btn text-[12px]"
              >
                <CornerUpLeft className="w-4 h-4 group-hover/btn:scale-110 transition-transform" strokeWidth={1.5} />
                Trả lời
              </button>
            )}


          </div>
        </div>
      </div>
    </div>
  );
};

// Comment Skeleton
const CommentSkeleton: React.FC = () => (
  <div className="bg-bg-secondary rounded-[16px] border border-white/5 p-4 md:p-5 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 md:w-11 md:h-11 bg-white/5 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <div className="h-4 bg-white/5 rounded-full w-32 mb-2" />
        <div className="h-4 bg-white/5 rounded-full w-full mb-2" />
        <div className="h-4 bg-white/5 rounded-full w-3/4" />
      </div>
    </div>
  </div>
);

export const ForumThreadPage: React.FC<ForumThreadPageProps> = ({ threadId }) => {
  const { token, isAuthenticated, user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Comment form
  const [commentContent, setCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Media upload for comments
  const [commentMediaUrls, setCommentMediaUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Report modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [showThreadMenu, setShowThreadMenu] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const threadMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (threadMenuRef.current && !threadMenuRef.current.contains(event.target as Node)) {
        setShowThreadMenu(false);
      }
    };
    if (showThreadMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showThreadMenu]);

  // Generic report handler for both thread and comments
  const handleSubmitReport = async () => {
    if (reportReason.length < 10 || !token) return;
    try {
      setIsReporting(true);
      const isCommentReport = reportingCommentId !== null;
      const response = await fetch(`${API_BASE_URL}/forum/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          target_type: isCommentReport ? 'COMMENT' : 'THREAD',
          target_id: isCommentReport ? reportingCommentId : threadId,
          reason: reportReason,
        }),
      });
      if (!response.ok) throw new Error('Không thể gửi báo cáo');
      showSuccess('Báo cáo đã được gửi thành công!');
      setShowReportModal(false);
      setReportReason('');
      setReportingCommentId(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Không thể gửi báo cáo');
    } finally {
      setIsReporting(false);
    }
  };

  // Handler to open report modal for a comment
  const handleReportComment = (commentId: string) => {
    setReportingCommentId(commentId);
    setShowReportModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !token) return;

    setIsUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await fetch(`${API_BASE_URL}/auth/upload-image`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });
        if (response.ok) {
          const result = await response.json();
          setCommentMediaUrls(prev => [...prev, result.url]);
        }
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeMedia = (index: number) => {
    setCommentMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const fetchThread = async () => {
    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/forum/threads/${threadId}`, { headers });
      if (!response.ok) throw new Error('Thread not found');

      const data = await response.json();
      // Normalize snake_case to camelCase
      setThread({
        ...data,
        mediaUrls: data.media_urls || data.mediaUrls || [],
        authorId: data.author_id || data.authorId,
        categoryId: data.category_id || data.categoryId,
        categoryName: data.category_name || data.categoryName,
        viewCount: data.view_count ?? data.viewCount ?? 0,
        commentCount: data.comment_count ?? data.commentCount ?? 0,
        likeCount: data.like_count ?? data.likeCount ?? 0,
        isLiked: data.is_liked ?? data.isLiked ?? false,
        createdAt: data.created_at || data.createdAt,
        updatedAt: data.updated_at || data.updatedAt,
        lastActivityAt: data.last_activity_at || data.lastActivityAt,
        author: data.author ? {
          ...data.author,
          avatarUrl: data.author.avatar_url || data.author.avatarUrl,
        } : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    }
  };

  const fetchComments = useCallback(async (cursor?: string) => {
    try {
      if (!cursor) setLoadingComments(true);

      const params = new URLSearchParams({ limit: '20' });
      if (cursor) params.append('cursor', cursor);

      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(
        `${API_BASE_URL}/forum/threads/${threadId}/comments?${params}`,
        { headers }
      );
      if (!response.ok) throw new Error('Failed to fetch comments');

      const data: ForumCommentsResponse = await response.json();

      if (cursor) {
        setComments(prev => [...prev, ...data.data]);
      } else {
        setComments(data.data);
      }
      setNextCursor(data.nextCursor || null);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  }, [threadId, token]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchThread();
      await fetchComments();
      setLoading(false);
    };
    loadData();
  }, [threadId]);

  // Infinite scroll for comments
  const loadMoreComments = useCallback(async () => {
    if (loadingComments || !hasMore || !nextCursor) return;
    await fetchComments(nextCursor);
  }, [loadingComments, hasMore, nextCursor, fetchComments]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingComments) {
          loadMoreComments();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingComments, loadMoreComments]);

  const handleLikeThread = async () => {
    if (!isAuthenticated || !thread) return;

    try {
      const response = await fetch(`${API_BASE_URL}/forum/threads/${threadId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to like');

      const data = await response.json();
      setThread({
        ...thread,
        isLiked: data.liked,
        likeCount: data.like_count,
      });
    } catch (err) {
      console.error('Error liking thread:', err);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch(`${API_BASE_URL}/forum/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to like comment');

      const data = await response.json();

      // Update comment in state
      const updateComment = (comments: ForumComment[]): ForumComment[] => {
        return comments.map(c => {
          if (c.id === commentId) {
            return { ...c, isLiked: data.liked, likeCount: data.like_count };
          }
          if (c.replies) {
            return { ...c, replies: updateComment(c.replies) };
          }
          return c;
        });
      };

      setComments(updateComment(comments));
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() && commentMediaUrls.length === 0) return;

    try {
      setSubmitting(true);

      let response: Response;

      if (replyingTo) {
        // Reply to comment
        response = await fetch(`${API_BASE_URL}/forum/comments/${replyingTo.id}/reply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ content: commentContent, media_urls: commentMediaUrls }),
        });
      } else {
        // New root comment
        response = await fetch(`${API_BASE_URL}/forum/threads/${threadId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ content: commentContent, media_urls: commentMediaUrls }),
        });
      }

      if (!response.ok) throw new Error('Failed to post comment');

      const newComment: ForumComment = await response.json();

      // All comments are flat now - just append to end of list
      setComments(prev => [...prev, newComment]);

      // Update thread comment count
      if (thread) {
        setThread({ ...thread, commentCount: thread.commentCount + 1 });
      }

      setCommentContent('');
      setCommentMediaUrls([]);
      setReplyingTo(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Không thể đăng bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  // Use shared time utility for thread page
  const formatDate = (dateStr: string): string => {
    return formatTimeAgo(dateStr);
  };

  // Set focus to comment input when replying
  useEffect(() => {
    if (replyingTo && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [replyingTo]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4 pb-32 md:pb-28 pt-6 w-full">
        {/* Thread Skeleton */}
        <div className="bg-bg-secondary rounded-[16px] border border-white/5 p-4 md:p-6 mb-6 animate-pulse">
          <div className="h-4 bg-white/5 rounded-full w-24 mb-4" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/5 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-white/5 rounded-full w-32 mb-2" />
              <div className="h-3 bg-white/5 rounded-full w-24" />
            </div>
          </div>
          <div className="h-8 bg-white/5 rounded-full w-3/4 mb-4" />
          <div className="space-y-2">
            <div className="h-4 bg-white/5 rounded-full w-full" />
            <div className="h-4 bg-white/5 rounded-full w-full" />
            <div className="h-4 bg-white/5 rounded-full w-2/3" />
          </div>
        </div>

        {/* Comments Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <CommentSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="max-w-3xl mx-auto p-4 pb-24 md:pb-20 pt-6 w-full">
        <div className="bg-red-500/10 border border-red-500/30 rounded-[16px] p-6 text-center">
          <div className="flex justify-center mb-3">
            <AlertCircle className="w-12 h-12 text-red-400" strokeWidth={1.5} />
          </div>
          <p className="text-red-400 mb-4">{error || 'Không tìm thấy chủ đề'}</p>
          <button
            onClick={() => window.location.hash = 'forum'}
            className="px-6 py-2 bg-primary/20 hover:bg-primary/30 text-primary 
                       rounded-full transition-all font-medium text-[13px]"
          >
            ← Quay lại diễn đàn
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 pb-32 md:pb-28 pt-6 w-full">
      {/* Thread Content */}
      <article className="bg-bg-secondary rounded-[16px] border border-white/5 overflow-hidden 
                          mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="p-4 md:p-6">
          {/* Back Button */}
          <button
            onClick={() => window.location.hash = thread.categoryId ? `forum/category/${thread.categoryId}` : 'forum'}
            className="flex items-center gap-2 text-white/50 hover:text-primary 
                       transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={1.5} />
            <span className="text-[13px]">{thread.categoryName || 'Quay lại'}</span>
          </button>

          {/* Author Header */}
          <div className="flex items-center gap-3 mb-4">
            <img
              src={thread.author.avatarUrl || `https://ui-avatars.com/api/?name=${thread.author.username}&background=random`}
              alt={thread.author.username}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover ring-2 ring-white/5 
                         cursor-pointer hover:ring-primary/30 transition-all"
              onClick={() => window.location.hash = `profile/${thread.authorId}`}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="font-semibold text-white text-[14px] md:text-[15px] cursor-pointer 
                             hover:text-primary transition-colors"
                  onClick={() => window.location.hash = `profile/${thread.authorId}`}
                >
                  {thread.author.username}
                </span>
                {thread.author.rank && (
                  <span className="text-[10px] px-2 py-0.5 bg-primary/20 text-primary 
                                   rounded-full font-medium">
                    {thread.author.rank}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-white/40 text-[12px] mt-0.5">
                <span>{formatDate(thread.createdAt)}</span>
                {thread.status === ThreadStatus.LOCKED && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-red-400">
                      <Lock className="w-3 h-3" strokeWidth={2} />
                      Đã khóa
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 3-dot menu - show for logged-in users viewing other's posts */}
            {isAuthenticated && thread.authorId !== user?.id && (
              <div className="relative" ref={threadMenuRef}>
                <button
                  onClick={() => setShowThreadMenu(!showThreadMenu)}
                  className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all"
                >
                  <MoreVertical size={18} />
                </button>

                {showThreadMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-bg-secondary border border-white/10 
                                  rounded-[10px] shadow-xl overflow-hidden z-50 min-w-[150px] 
                                  animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => { setShowThreadMenu(false); setReportingCommentId(null); setShowReportModal(true); }}
                      className="w-full px-4 py-2.5 flex items-center gap-2 text-yellow-400 
                                 hover:bg-white/5 transition-colors text-[13px]"
                    >
                      <AlertTriangle size={16} />
                      Báo cáo
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-white text-[20px] md:text-[24px] font-bold mb-4 leading-tight">
            {thread.title}
          </h1>

          {/* Content */}
          <div className="text-white/80 text-[14px] md:text-[15px] leading-relaxed 
                          whitespace-pre-wrap break-words">
            {thread.content}
          </div>

          {/* Media */}
          {thread.mediaUrls?.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
              {thread.mediaUrls.map((url, i) => (
                <div key={i} className="relative aspect-video rounded-[12px] overflow-hidden 
                                         bg-black/20 group">
                  <img
                    src={url}
                    alt="Thread media"
                    className="w-full h-full object-cover transition-transform 
                               group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 md:gap-6 mt-6 pt-4 border-t border-white/5">
            <button
              onClick={handleLikeThread}
              disabled={!isAuthenticated}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all group/btn
                         ${thread.isLiked
                  ? 'bg-primary/20 text-primary'
                  : 'bg-white/5 text-white/60 hover:bg-primary/10 hover:text-primary'}
                         disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Heart
                className="w-5 h-5 group-hover/btn:scale-110 transition-transform"
                strokeWidth={1.5}
                fill={thread.isLiked ? 'currentColor' : 'none'}
              />
              <span className="font-semibold text-[13px]">{thread.likeCount}</span>
            </button>

            <div className="flex items-center gap-2 text-blue-400/70">
              <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
              <span className="font-semibold text-[13px]">{thread.commentCount}</span>
              <span className="text-white/40 text-[12px] hidden sm:inline">bình luận</span>
            </div>

            <div className="flex items-center gap-2 text-white/40">
              <Eye className="w-5 h-5" strokeWidth={1.5} />
              <span className="font-semibold text-[13px]">{thread.viewCount}</span>
              <span className="text-white/40 text-[12px] hidden sm:inline">lượt xem</span>
            </div>


          </div>
        </div>
      </article>

      {/* Comments Section */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-primary" strokeWidth={1.5} />
          <h2 className="text-white text-[16px] md:text-[18px] font-semibold">
            Bình luận ({thread.commentCount})
          </h2>
        </div>

        {/* Comments List */}
        {loadingComments && comments.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <CommentSkeleton key={i} />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="bg-bg-secondary rounded-[16px] border border-white/5 p-8 text-center">
            <div className="flex justify-center mb-3">
              <MessageSquare className="w-12 h-12 text-white/20" strokeWidth={1.5} />
            </div>
            <p className="text-white/40 text-[14px] mb-1">Chưa có bình luận nào</p>
            {isAuthenticated && (
              <p className="text-white/30 text-[12px]">Hãy là người đầu tiên bình luận!</p>
            )}
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {comments.map((comment, index) => (
              <div
                key={comment.id}
                className="animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <CommentItem
                  comment={comment}
                  onReply={(id, username) => setReplyingTo({ id, username })}
                  onLike={handleLikeComment}
                  onReport={handleReportComment}
                  isAuthenticated={isAuthenticated}
                  currentUserId={user?.id}
                  commentNumber={index + 1}
                />
              </div>
            ))}
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {loadingComments && comments.length > 0 && (
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          )}
        </div>
      </section>

      {/* Comment Form - Fixed at bottom */}
      {isAuthenticated && thread.status !== ThreadStatus.LOCKED && (
        <div className="fixed bottom-0 left-0 md:left-[126px] right-0 bg-bg-main/95 backdrop-blur-lg 
                        border-t border-white/5 py-4 z-40">
          <form onSubmit={handleSubmitComment} className="max-w-3xl mx-auto px-4">
            {/* Replying indicator */}
            {replyingTo && (
              <div className="flex items-center gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex-1 bg-primary/10 border-l-2 border-primary px-3 py-2 rounded-r-lg">
                  <span className="text-primary text-[12px] font-medium">
                    Trả lời @{replyingTo.username}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="p-1.5 hover:bg-white/5 rounded-full text-white/40 hover:text-red-400 
                             transition-all"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            )}

            {/* Media preview */}
            {commentMediaUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 animate-in fade-in">
                {commentMediaUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt=""
                      className="h-14 w-14 object-cover rounded-lg border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full 
                                 flex items-center justify-center hover:bg-red-400 transition-colors"
                    >
                      <X className="w-3 h-3 text-white" strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input row */}
            <div className="flex items-center gap-3">
              {/* User avatar */}
              <img
                src={user?.avatar_url || '/assets/images/home.svg'}
                alt=""
                className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover ring-2 ring-white/5 
                           flex-shrink-0"
              />

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 
                           rounded-full transition-all disabled:opacity-50 flex-shrink-0"
                title="Thêm ảnh"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
                ) : (
                  <ImagePlus className="w-5 h-5 text-green-400" strokeWidth={1.5} />
                )}
              </button>

              {/* Text input */}
              <input
                ref={commentInputRef}
                type="text"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder={replyingTo ? `Trả lời @${replyingTo.username}...` : 'Viết bình luận...'}
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-full
                           focus:outline-none focus:border-primary/50 text-white text-[13px]
                           placeholder-white/30 transition-colors"
                maxLength={5000}
              />

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting || (!commentContent.trim() && commentMediaUrls.length === 0)}
                className="p-2.5 bg-primary hover:bg-primary/90 text-white rounded-full 
                           transition-all disabled:opacity-50 disabled:cursor-not-allowed
                           shadow-lg shadow-primary/20 flex-shrink-0"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" strokeWidth={1.5} />
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Locked thread message */}
      {thread.status === ThreadStatus.LOCKED && (
        <div className="fixed bottom-0 left-0 md:left-[126px] right-0 bg-bg-main/95 backdrop-blur-lg 
                        border-t border-white/5 py-4 text-center z-40">
          <div className="max-w-3xl mx-auto px-4">
            <p className="flex items-center justify-center gap-2 text-white/50 text-[13px]">
              <Lock className="w-4 h-4" strokeWidth={1.5} />
              Chủ đề này đã bị khóa, không thể bình luận thêm
            </p>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => { setShowReportModal(false); setReportReason(''); setReportingCommentId(null); }}
          />
          <div className="relative bg-bg-secondary rounded-[16px] border border-white/10 p-6 max-w-[360px] w-full animate-in zoom-in-95 fade-in duration-200">
            <h3 className="text-white font-bold text-[16px] mb-2 flex items-center gap-2">
              <AlertTriangle className="text-yellow-400" size={20} />
              {reportingCommentId ? 'Báo cáo bình luận' : 'Báo cáo bài viết'}
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
                onClick={() => { setShowReportModal(false); setReportReason(''); setReportingCommentId(null); }}
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
    </div>
  );
};

export default ForumThreadPage;
