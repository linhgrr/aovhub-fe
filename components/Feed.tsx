import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/authContext';
import { PostDetailModal } from './PostDetailModal';
import { PostCard, FeedPost } from './PostCard';
import { SharePostModal } from './SharePostModal';
import { CreatePost } from './CreatePost';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface FeedResponse {
  data: FeedPost[];
  next_cursor: string | null;
  has_more: boolean;
}

export const Feed: React.FC = () => {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const [postToShare, setPostToShare] = useState<FeedPost | null>(null);
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);

  const fetchFeed = async (cursor?: string) => {
    if (!token) return;
    try {
      const url = new URL(`${API_URL}/posts/feed`);
      url.searchParams.set('limit', '10');
      if (cursor) url.searchParams.set('cursor', cursor);
      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch feed');
      const result: FeedResponse = await response.json();
      if (cursor) setPosts(prev => [...prev, ...result.data]);
      else setPosts(result.data);
      setNextCursor(result.next_cursor);
      setHasMore(result.has_more);
    } catch (err) {
      setError('Không thể tải bài viết.');
      console.error(err);
    }
  };

  useEffect(() => {
    const loadFeed = async () => {
      setIsLoading(true);
      await fetchFeed();
      setIsLoading(false);
    };
    if (token) loadFeed();
  }, [token]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !nextCursor) return;
    setIsLoadingMore(true);
    await fetchFeed(nextCursor);
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore, nextCursor]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) loadMore();
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  const handleLikePost = useCallback(async (postId: string, isCurrentlyLiked: boolean) => {
    if (!token) return;
    try {
      const method = isCurrentlyLiked ? 'DELETE' : 'POST';
      const response = await fetch(`${API_URL}/posts/${postId}/like`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        setPosts(prev => prev.map(post =>
          post.id === postId
            ? { ...post, like_count: result.like_count, is_liked: result.is_liked }
            : post
        ));
      }
    } catch (err) {
      console.error('Like action failed:', err);
    }
  }, [token, API_URL]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full pb-24 md:pb-20 pt-6 md:pt-10 pl-4 md:pl-20 px-4 md:px-10">

      <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <CreatePost
          apiUrl={API_URL}
          onPostCreated={(newPost) => setPosts(prev => [newPost, ...prev])}
        />
      </div>

      {/* Post List */}
      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={handleLikePost}
            onOpenComments={setSelectedPost}
            onShare={setPostToShare}
          />
        ))}
      </div>

      {/* Infinite Scroll Trigger */}
      <div ref={loadMoreRef} className="py-10 flex justify-center">
        {isLoadingMore && <Loader2 className="w-6 h-6 text-primary animate-spin" />}
      </div>

      {/* Modals */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          onPostUpdate={(updatedPost) => setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p))}
        />
      )}

      {postToShare && (
        <SharePostModal
          post={postToShare}
          isOpen={!!postToShare}
          onClose={() => setPostToShare(null)}
          onShareComplete={(newPost) => {
            setPosts(prev => [newPost, ...prev]);
            setPostToShare(null);
          }}
          token={token || ''}
        />
      )}
    </div>
  );
};
