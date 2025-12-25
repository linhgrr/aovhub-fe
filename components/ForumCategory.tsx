import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HiOutlineChatBubbleLeft, HiOutlineHeart, HiOutlineEye, HiOutlinePhoto, HiXMark, HiArrowLeft, HiPlus, HiOutlineClock, HiOutlineArrowTrendingUp, HiOutlineFire } from 'react-icons/hi2';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { ForumCategory, ForumThreadListItem, ForumThreadsResponse, ThreadStatus } from '../types';
import { API_BASE_URL } from '../constants';
import { useAuth } from '../contexts/authContext';
import { formatTimeAgo } from '../utils/timeUtils';

interface ForumCategoryPageProps {
  categoryId: string;
}

// Skeleton for thread loading
const ThreadSkeleton: React.FC = () => (
  <div className="bg-bg-secondary rounded-[16px] border border-white/5 p-4 md:p-5 animate-pulse">
    <div className="flex items-start gap-3 md:gap-4">
      <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <div className="h-5 bg-white/5 rounded-full w-3/4 mb-2" />
        <div className="h-4 bg-white/5 rounded-full w-1/2 mb-3" />
        <div className="flex gap-4">
          <div className="h-3 bg-white/5 rounded-full w-16" />
          <div className="h-3 bg-white/5 rounded-full w-16" />
          <div className="h-3 bg-white/5 rounded-full w-16" />
        </div>
      </div>
    </div>
  </div>
);

export const ForumCategoryPage: React.FC<ForumCategoryPageProps> = ({ categoryId }) => {
  const { token, isAuthenticated } = useAuth();
  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [threads, setThreads] = useState<ForumThreadListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'activity' | 'popular'>('latest');

  // Infinite scroll ref
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // New thread modal
  const [showNewThread, setShowNewThread] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Media upload for new thread
  const [threadMediaUrls, setThreadMediaUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          setThreadMediaUrls(prev => [...prev, result.url]);
        }
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeMedia = (index: number) => {
    setThreadMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const fetchCategory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/forum/categories/${categoryId}`);
      if (!response.ok) throw new Error('Category not found');
      const data: ForumCategory = await response.json();
      setCategory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    }
  };

  const fetchThreads = useCallback(async (cursor?: string) => {
    try {
      if (!cursor) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams({ sort: sortBy, limit: '15' });
      if (cursor) params.append('cursor', cursor);

      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(
        `${API_BASE_URL}/forum/categories/${categoryId}/threads?${params}`,
        { headers }
      );
      if (!response.ok) throw new Error('Failed to fetch threads');

      const data: ForumThreadsResponse = await response.json();

      // Normalize snake_case to camelCase from API
      const normalizedThreads = data.data.map((thread: any) => ({
        ...thread,
        createdAt: thread.createdAt || thread.created_at,
        lastActivityAt: thread.lastActivityAt || thread.last_activity_at,
        viewCount: thread.viewCount ?? thread.view_count ?? 0,
        commentCount: thread.commentCount ?? thread.comment_count ?? 0,
        likeCount: thread.likeCount ?? thread.like_count ?? 0,
        contentPreview: thread.contentPreview || thread.content_preview || '',
        categoryId: thread.categoryId || thread.category_id,
        author: thread.author ? {
          ...thread.author,
          avatarUrl: thread.author.avatarUrl || thread.author.avatar_url,
        } : thread.author,
      }));

      if (cursor) {
        setThreads(prev => [...prev, ...normalizedThreads]);
      } else {
        setThreads(normalizedThreads);
      }
      setNextCursor(data.nextCursor || (data as any).next_cursor || null);
      setHasMore(data.hasMore ?? (data as any).has_more ?? false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [categoryId, sortBy, token]);

  // Initial load
  useEffect(() => {
    fetchCategory();
    fetchThreads();
  }, [categoryId, sortBy]);

  // Infinite scroll setup
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !nextCursor) return;
    await fetchThreads(nextCursor);
  }, [loadingMore, hasMore, nextCursor, fetchThreads]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  const handleThreadClick = (threadId: string) => {
    window.location.hash = `forum/thread/${threadId}`;
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch(
        `${API_BASE_URL}/forum/categories/${categoryId}/threads`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: newTitle,
            content: newContent,
            media_urls: threadMediaUrls,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to create thread');

      const thread = await response.json();
      setShowNewThread(false);
      setNewTitle('');
      setNewContent('');
      setThreadMediaUrls([]);

      // Navigate to new thread
      window.location.hash = `forum/thread/${thread.id}`;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể tạo chủ đề');
    } finally {
      setSubmitting(false);
    }
  };

  // Use shared time utility
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    return formatTimeAgo(dateStr);
  };

  const sortOptions = [
    { key: 'latest' as const, label: 'Mới nhất', Icon: HiOutlineClock },
    { key: 'activity' as const, label: 'Hoạt động', Icon: HiOutlineArrowTrendingUp },
    { key: 'popular' as const, label: 'Phổ biến', Icon: HiOutlineFire },
  ];

  if (loading && !threads.length) {
    return (
      <div className="max-w-3xl mx-auto p-4 pb-24 md:pb-8 w-full pt-6">
        {/* Header Skeleton */}
        <div className="bg-bg-secondary rounded-[16px] border border-white/5 p-4 md:p-6 mb-6 animate-pulse">
          <div className="h-3 bg-white/5 rounded-full w-20 mb-3" />
          <div className="h-8 bg-white/5 rounded-full w-48 mb-2" />
          <div className="h-4 bg-white/5 rounded-full w-72" />
        </div>

        {/* Threads Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <ThreadSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 pb-24 md:pb-8 w-full pt-6">
      {/* Header Section */}
      <div className="bg-bg-secondary rounded-[16px] border border-white/5 overflow-hidden mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="p-4 md:p-6">
          {/* Back Button */}
          <button
            onClick={() => window.location.hash = 'forum'}
            className="flex items-center gap-2 text-white/50 hover:text-primary 
                       transition-colors mb-4 group"
          >
            <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[13px]">Quay lại diễn đàn</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <span className="text-primary text-[12px] font-medium tracking-wide uppercase">
                Danh mục
              </span>
              <h1 className="text-white text-[22px] md:text-[28px] font-bold mt-1 tracking-tight">
                {category?.name || 'Đang tải...'}
              </h1>
              {category?.description && (
                <p className="text-white/40 text-[13px] md:text-[14px] mt-2 leading-relaxed">
                  {category.description}
                </p>
              )}
            </div>

            {isAuthenticated && (
              <button
                onClick={() => setShowNewThread(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary 
                           hover:bg-primary/90 text-white font-semibold rounded-full 
                           transition-all shadow-lg shadow-primary/20 active:scale-95
                           text-[13px] md:text-[14px] flex-shrink-0"
              >
                <HiPlus className="w-4 h-4" />
                Tạo chủ đề
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sort Tabs */}
      <div className="flex items-center gap-2 mb-4 md:mb-6 overflow-x-auto pb-2 animate-in fade-in duration-300">
        {sortOptions.map((option) => {
          const Icon = option.Icon;
          return (
            <button
              key={option.key}
              onClick={() => setSortBy(option.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[12px] md:text-[13px] 
                         font-medium transition-all whitespace-nowrap flex-shrink-0
                         ${sortBy === option.key
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-bg-secondary text-white/50 hover:text-white/80 border border-white/5 hover:border-white/10'}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Thread List */}
      {threads.length === 0 ? (
        <div className="bg-bg-secondary rounded-[16px] border border-white/5 p-8 md:p-12 
                        text-center animate-in fade-in duration-500">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-white text-lg font-semibold mb-2">Chưa có chủ đề nào</h3>
          <p className="text-white/40 text-[13px] mb-4">
            Hãy là người đầu tiên tạo chủ đề trong danh mục này!
          </p>
          {isAuthenticated && (
            <button
              onClick={() => setShowNewThread(true)}
              className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white 
                         font-semibold rounded-full transition-all text-[13px]"
            >
              Tạo chủ đề đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {threads.map((thread, index) => (
            <button
              key={thread.id}
              onClick={() => handleThreadClick(thread.id)}
              className="w-full bg-bg-secondary rounded-[16px] border border-white/5 
                         hover:border-primary/30 p-4 md:p-5 transition-all duration-300 
                         text-left group hover:shadow-lg hover:shadow-primary/5
                         animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex items-start gap-3 md:gap-4">
                {/* Author avatar */}
                <img
                  src={thread.author.avatarUrl || `https://ui-avatars.com/api/?name=${thread.author.username}&background=random`}
                  alt={thread.author.username}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover flex-shrink-0 
                             ring-2 ring-white/5 group-hover:ring-primary/30 transition-all"
                />

                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white text-[14px] md:text-[15px] 
                                   group-hover:text-primary transition-colors line-clamp-1">
                      {thread.title}
                    </h3>
                    {thread.status === ThreadStatus.LOCKED && (
                      <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 
                                       rounded-full flex-shrink-0">
                        🔒 Khóa
                      </span>
                    )}
                  </div>

                  {/* Preview */}
                  <p className="text-white/40 text-[12px] md:text-[13px] line-clamp-1 mb-2">
                    {thread.contentPreview}
                  </p>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] md:text-[12px]">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.hash = `profile/${thread.author.id}`;
                      }}
                      className="text-primary/70 hover:text-primary hover:underline cursor-pointer font-medium"
                    >
                      @{thread.author.username}
                    </span>
                    <span className="text-white/30">•</span>
                    <span className="text-white/40">{formatDate(thread.createdAt)}</span>

                    {/* Stats */}
                    <div className="flex items-center gap-3 ml-auto">
                      <span className="flex items-center gap-1 text-white/40">
                        <HiOutlineEye className="w-3.5 h-3.5" />
                        {thread.viewCount}
                      </span>
                      <span className="flex items-center gap-1 text-blue-400/70">
                        <HiOutlineChatBubbleLeft className="w-3.5 h-3.5" />
                        {thread.commentCount}
                      </span>
                      <span className="flex items-center gap-1 text-primary/70">
                        <HiOutlineHeart className="w-3.5 h-3.5" />
                        {thread.likeCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      <div ref={loadMoreRef} className="py-10 flex justify-center">
        {loadingMore && (
          <AiOutlineLoading3Quarters className="w-6 h-6 text-primary animate-spin" />
        )}
      </div>

      {/* New Thread Modal */}
      {showNewThread && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => {
              if (!newTitle && !newContent && threadMediaUrls.length === 0) {
                setShowNewThread(false);
              }
            }}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-[600px] bg-bg-secondary rounded-[20px] 
                          border border-white/10 shadow-2xl max-h-[90vh] overflow-hidden
                          animate-in fade-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-white/5">
              <h2 className="text-white text-[18px] font-semibold">Tạo chủ đề mới</h2>
              <button
                onClick={() => {
                  setShowNewThread(false);
                  setNewTitle('');
                  setNewContent('');
                  setThreadMediaUrls([]);
                }}
                className="p-2 hover:bg-white/5 rounded-full text-white/60 
                           hover:text-white transition-all"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateThread} className="p-4 md:p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Category badge */}
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-[12px]">Danh mục:</span>
                <span className="px-3 py-1 bg-primary/20 text-primary text-[12px] 
                                 font-medium rounded-full">
                  {category?.name}
                </span>
              </div>

              {/* Title input */}
              <div>
                <label className="block text-white/60 text-[12px] font-medium mb-2">
                  Tiêu đề <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nhập tiêu đề chủ đề..."
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-[12px]
                             focus:outline-none focus:border-primary/50 text-white text-[14px]
                             placeholder-white/30 transition-colors"
                  maxLength={200}
                  required
                />
              </div>

              {/* Content textarea */}
              <div>
                <label className="block text-white/60 text-[12px] font-medium mb-2">
                  Nội dung <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Chia sẻ suy nghĩ của bạn..."
                  rows={6}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-[12px]
                             focus:outline-none focus:border-primary/50 text-white text-[14px]
                             placeholder-white/30 resize-none transition-colors"
                  maxLength={10000}
                  required
                />
              </div>

              {/* Media upload section */}
              <div>
                <label className="block text-white/60 text-[12px] font-medium mb-2">
                  Hình ảnh (tùy chọn)
                </label>

                {/* Media preview */}
                {threadMediaUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {threadMediaUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-[10px] 
                                                   overflow-hidden group bg-black/20">
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeMedia(index)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 backdrop-blur 
                                     rounded-full flex items-center justify-center 
                                     opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
                        >
                          <HiXMark className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-black/30 border border-white/10 
                             rounded-[10px] hover:bg-white/5 hover:border-green-500/30 
                             transition-colors disabled:opacity-50 text-[13px]"
                >
                  {isUploading ? (
                    <AiOutlineLoading3Quarters className="w-4 h-4 text-green-400 animate-spin" />
                  ) : (
                    <HiOutlinePhoto className="w-4 h-4 text-green-400" />
                  )}
                  <span className="text-white/60">Thêm ảnh</span>
                </button>
              </div>

              {/* Submit buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewThread(false);
                    setNewTitle('');
                    setNewContent('');
                    setThreadMediaUrls([]);
                  }}
                  className="px-5 py-2.5 text-white/50 hover:text-white transition-colors 
                             text-[13px] font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newTitle.trim() || !newContent.trim()}
                  className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white 
                             font-semibold rounded-full transition-all disabled:opacity-50 
                             disabled:cursor-not-allowed text-[13px] shadow-lg shadow-primary/20"
                >
                  {submitting ? (
                    <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
                  ) : (
                    'Đăng chủ đề'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumCategoryPage;
