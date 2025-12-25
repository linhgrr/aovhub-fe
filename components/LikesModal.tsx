import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, Heart } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface LikeUser {
  id: string;
  username: string;
  avatar_url: string | null;
  rank: string | null;
  level: number | null;
}

interface LikesModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  totalCount: number;
}

export const LikesModal: React.FC<LikesModalProps> = ({
  postId,
  isOpen,
  onClose,
  totalCount,
}) => {
  const [users, setUsers] = useState<LikeUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const fetchLikes = useCallback(async (cursor?: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      if (!cursor) setIsLoading(true);
      else setIsLoadingMore(true);

      const url = new URL(`${API_URL}/posts/${postId}/likes`);
      url.searchParams.set('limit', '20');
      if (cursor) url.searchParams.set('cursor', cursor);

      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        if (cursor) {
          setUsers(prev => [...prev, ...result.data]);
        } else {
          setUsers(result.data);
        }
        setNextCursor(result.next_cursor);
        setHasMore(result.has_more);
      }
    } catch (error) {
      console.error('Failed to fetch likes:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [postId]);

  useEffect(() => {
    if (isOpen) {
      fetchLikes();
    } else {
      setUsers([]);
      setNextCursor(null);
      setHasMore(false);
    }
  }, [isOpen, fetchLikes]);

  // Infinite scroll
  useEffect(() => {
    if (!isOpen) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && nextCursor) {
          fetchLikes(nextCursor);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);

    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoadingMore, nextCursor, isOpen, fetchLikes]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div
        className="bg-bg-secondary rounded-[20px] w-full max-w-[400px] max-h-[80vh] flex flex-col border border-white/5 shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-montserrat font-bold text-white text-sm">Likes</h3>
              <p className="text-[#7f7f7f] text-xs">{totalCount} người đã thích</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-[#7f7f7f] text-sm">
              Chưa có ai thích bài viết này
            </div>
          ) : (
            <>
              {users.map((user) => (
                <a
                  key={user.id}
                  href={`#profile/${user.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-[12px] hover:bg-white/5 transition-colors group"
                >
                  <img
                    src={user.avatar_url || '/assets/images/home.svg'}
                    alt={user.username}
                    className="w-[44px] h-[44px] rounded-[12px] object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-montserrat font-semibold text-white text-[13px] truncate group-hover:text-primary transition-colors">
                      {user.username}
                    </p>
                    <p className="text-[#7f7f7f] text-[11px]">
                      {user.rank || 'Chưa xếp hạng'} • Level {user.level || 1}
                    </p>
                  </div>
                  <button
                    className="bg-primary/20 text-primary text-[10px] font-semibold px-3 py-1.5 rounded-[6px] hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Could add follow functionality here
                    }}
                  >
                    Xem
                  </button>
                </a>
              ))}

              {/* Load more trigger */}
              <div ref={loadMoreRef} className="py-4 flex justify-center">
                {isLoadingMore && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LikesModal;


