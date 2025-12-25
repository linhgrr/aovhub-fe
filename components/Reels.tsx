import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, AlertCircle, Plus, Volume2, VolumeX, Play, Pause, MessageCircle, Share2, Bookmark, ChevronUp, ChevronDown } from 'lucide-react';
import { CreateReel } from './CreateReel';
import { MyReelsPanel } from './MyReelsPanel';
import { ReelCommentsPanel } from './ReelCommentsPanel';
import { HashtagText } from './HashtagText';

interface ReelData {
  id: string;
  user_id: string;
  username: string;
  user_avatar?: string;
  video_url: string;
  video_raw_url?: string;
  thumbnail_url: string;
  duration: number;
  video_processed?: boolean;
  caption?: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked: boolean;
  created_at: string;
}

interface ReelFeedResponse {
  reels: ReelData[];
  has_more: boolean;
}

// Format number for display (1000 -> 1K)
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export const Reels: React.FC = () => {
  const [reels, setReels] = useState<ReelData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [hasMore, setHasMore] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMyReelsPanel, setShowMyReelsPanel] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [prevVolume, setPrevVolume] = useState(0.5);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);

  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const isScrolling = useRef(false);
  const lastTapTime = useRef(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

  useEffect(() => {
    loadReels();
  }, []);

  // Play/pause videos based on current index
  useEffect(() => {
    if (reels.length === 0) return;

    Object.keys(videoRefs.current).forEach((key) => {
      const index = parseInt(key);
      const video = videoRefs.current[index];
      if (video) {
        if (index === currentIndex) {
          video.muted = isMuted;
          video.volume = isMuted ? 0 : volume;
          if (!isPaused) {
            video.play().catch(err => console.error('Play error:', err));
          }
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }, [currentIndex, reels, isMuted, isPaused, volume]);

  // Progress bar update
  useEffect(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    if (!isPaused && reels[currentIndex]) {
      progressInterval.current = setInterval(() => {
        const video = videoRefs.current[currentIndex];
        if (video && video.duration) {
          setProgress((video.currentTime / video.duration) * 100);
        }
      }, 100);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentIndex, isPaused, reels]);

  // Mark reel as viewed
  useEffect(() => {
    if (reels[currentIndex]) {
      markAsViewed(reels[currentIndex].id);
    }
  }, [currentIndex, reels]);

  const loadReels = async () => {
    try {
      setIsLoading(true);
      setError('');

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/reels/feed?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to load reels');

      const data: ReelFeedResponse = await response.json();
      setReels(data.reels);
      setHasMore(data.has_more);
    } catch (err) {
      console.error('Load reels error:', err);
      setError('Không thể tải reels. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsViewed = async (reelId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`${API_URL}/reels/${reelId}/view`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: true }),
      });
    } catch (err) {
      console.error('Mark viewed error:', err);
    }
  };

  const handleLike = async (reelId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/reels/${reelId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        setReels(prev => prev.map(reel =>
          reel.id === reelId
            ? { ...reel, is_liked: result.liked, likes_count: result.likes_count }
            : reel
        ));
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  // Double tap to like
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      const currentReel = reels[currentIndex];
      if (currentReel && !currentReel.is_liked) {
        handleLike(currentReel.id);
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 1000);
      }
    }
    lastTapTime.current = now;
  }, [currentIndex, reels]);

  const handleScroll = useCallback((direction: 'up' | 'down') => {
    if (isScrolling.current) return;

    isScrolling.current = true;
    setProgress(0);

    if (direction === 'down') {
      setCurrentIndex(prev => (prev + 1) % reels.length);
    } else {
      setCurrentIndex(prev => (prev - 1 + reels.length) % reels.length);
    }

    setTimeout(() => {
      isScrolling.current = false;
    }, 400);
  }, [reels.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (Math.abs(diff) > 50) {
      handleScroll(diff > 0 ? 'down' : 'up');
    }
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    handleScroll(e.deltaY > 0 ? 'down' : 'up');
  }, [handleScroll]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') handleScroll('down');
      if (e.key === 'ArrowUp' || e.key === 'k') handleScroll('up');
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(prev => !prev);
      }
      if (e.key === 'm') setIsMuted(prev => !prev);
      if (e.key === 'l') {
        const currentReel = reels[currentIndex];
        if (currentReel) handleLike(currentReel.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleScroll, currentIndex, reels]);

  // Toggle play/pause on video click
  const handleVideoClick = () => {
    handleDoubleTap();
    // Single tap handled by detecting if it's not a double tap
  };

  const togglePlayPause = () => {
    setIsPaused(prev => {
      const video = videoRefs.current[currentIndex];
      if (video) {
        if (prev) video.play();
        else video.pause();
      }
      return !prev;
    });
  };

  // Loading state
  if (isLoading && reels.length === 0) {
    return (
      <div className="h-screen bg-bg-main flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-[13px]">Đang tải Reels...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && reels.length === 0) {
    return (
      <div className="h-screen bg-bg-main flex items-center justify-center">
        <div className="text-center px-6">
          <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <p className="text-white/80 text-[14px] mb-6">{error}</p>
          <button
            onClick={loadReels}
            className="px-8 py-3 bg-primary text-white rounded-[12px] font-semibold text-[13px] hover:bg-primary/90 transition-all"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (reels.length === 0) {
    return (
      <>
        {showCreateModal && (
          <CreateReel
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              loadReels();
              setCurrentIndex(0);
            }}
          />
        )}
        <div className="h-screen bg-bg-main flex items-center justify-center">
          <div className="text-center px-6 max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-[20px] flex items-center justify-center border border-primary/20">
              <Play className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-[22px] font-bakbak text-white mb-3">Chưa có Reel nào</h2>
            <p className="text-[#7f7f7f] text-[13px] mb-8 leading-relaxed">
              Hãy là người đầu tiên chia sẻ khoảnh khắc gameplay của bạn!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-8 py-3.5 bg-primary text-white rounded-[12px] font-semibold text-[13px] hover:bg-primary/90 transition-all flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Tạo Reel đầu tiên
            </button>
          </div>
        </div>
      </>
    );
  }

  const currentReel = reels[currentIndex];

  return (
    <>
      {/* Create Reel Modal */}
      {showCreateModal && (
        <CreateReel
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadReels();
            setCurrentIndex(0);
          }}
        />
      )}

      {/* MyReels Panel */}
      <MyReelsPanel
        isOpen={showMyReelsPanel}
        onClose={() => setShowMyReelsPanel(false)}
        onReelClick={(reelId) => {
          setShowMyReelsPanel(false);
          const reelIndex = reels.findIndex(r => r.id === reelId);
          if (reelIndex >= 0) setCurrentIndex(reelIndex);
        }}
      />

      <div
        ref={containerRef}
        className="h-screen bg-black overflow-hidden relative select-none ml-4 mr-4 rounded-l-2xl"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-30">
          <div
            className="h-full bg-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Reel Counter
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
          <span className="text-white/60 text-[11px] font-medium bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
            {currentIndex + 1} / {reels.length}
          </span>
        </div> */}

        {/* Video Container with snap scroll simulation */}
        <div className="absolute inset-0">
          {reels.map((reel, index) => (
            <div
              key={reel.id}
              className={`absolute inset-0 transition-all duration-400 ease-out ${index === currentIndex
                ? 'opacity-100 scale-100 z-10'
                : index < currentIndex
                  ? 'opacity-0 -translate-y-full z-0'
                  : 'opacity-0 translate-y-full z-0'
                }`}
              onClick={handleVideoClick}
            >
              <video
                ref={(el) => { if (el) videoRefs.current[index] = el; }}
                src={reel.video_processed ? reel.video_url : (reel.video_raw_url || reel.video_url)}
                poster={reel.thumbnail_url}
                className="w-full h-full object-contain bg-black"
                loop
                playsInline
                muted={isMuted}
              />

              {/* Gradient overlay for better readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />
            </div>
          ))}
        </div>

        {/* Heart Animation (Double Tap) */}
        {showHeartAnimation && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <svg
              className="w-24 h-24 text-red-500 animate-ping"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
        )}

        {/* Pause Indicator */}
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="w-20 h-20 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Play className="w-10 h-10 text-white ml-1" />
            </div>
          </div>
        )}

        {/* Top Actions */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-3">
          {/* My Reels */}
          <button
            onClick={() => setShowMyReelsPanel(true)}
            className="w-10 h-10 bg-bg-secondary/80 backdrop-blur-md rounded-[12px] flex items-center justify-center hover:bg-bg-secondary transition-all"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </button>

          {/* Create */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-10 h-10 bg-primary rounded-[12px] flex items-center justify-center hover:bg-primary/90 transition-all"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Right Side Actions */}
        <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 z-20">
          {/* User Avatar */}
          <a
            href={`#profile/${currentReel.user_id}`}
            className="relative"
          >
            <div className="w-12 h-12 rounded-[14px] overflow-hidden border-2 border-white/80 shadow-lg">
              {currentReel.user_avatar ? (
                <img src={currentReel.user_avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {currentReel.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-black">
              <Plus className="w-3 h-3 text-white" />
            </div>
          </a>

          {/* Like Button */}
          <button
            onClick={() => handleLike(currentReel.id)}
            className="flex flex-col items-center gap-1 group"
          >
            <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center transition-all ${currentReel.is_liked ? 'bg-red-500/20' : 'bg-white/10 group-hover:bg-white/20'
              }`}>
              <svg
                className={`w-6 h-6 transition-all ${currentReel.is_liked ? 'text-red-500 scale-110' : 'text-white'}`}
                viewBox="0 0 24 24"
                fill={currentReel.is_liked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <span className="text-white text-[11px] font-semibold">{formatNumber(currentReel.likes_count)}</span>
          </button>

          {/* Comment Button */}
          <button
            onClick={() => setShowCommentsPanel(true)}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-12 h-12 rounded-[14px] bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-all">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-[11px] font-semibold">{formatNumber(currentReel.comments_count)}</span>
          </button>

          {/* Share Button */}
          <button className="flex flex-col items-center gap-1 group">
            <div className="w-12 h-12 rounded-[14px] bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-all">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-[11px] font-semibold">{formatNumber(currentReel.shares_count)}</span>
          </button>

          {/* Bookmark */}
          <button className="group">
            <div className="w-12 h-12 rounded-[14px] bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-all">
              <Bookmark className="w-6 h-6 text-white" />
            </div>
          </button>
        </div>

        {/* Bottom Info */}
        <div className="absolute left-4 right-24 bottom-8 z-20">
          {/* Username */}
          <a href={`#profile/${currentReel.user_id}`} className="inline-block mb-2">
            <p className="text-white font-montserrat font-bold text-[15px] hover:text-primary transition-colors">
              @{currentReel.username}
            </p>
          </a>

          {/* Caption */}
          {currentReel.caption && (
            <p className="text-white/90 text-[13px] leading-relaxed mb-3 line-clamp-2">
              <HashtagText content={currentReel.caption} />
            </p>
          )}

          {/* Audio & Controls */}
          <div className="flex items-center gap-4">
            {/* Volume Control */}
            <div
              className="relative flex items-center gap-2"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                onClick={() => {
                  if (isMuted) {
                    // Unmute: restore previous volume
                    const newVol = prevVolume > 0 ? prevVolume : 0.5;
                    setVolume(newVol);
                    setIsMuted(false);
                  } else {
                    // Mute: save current and set to 0
                    setPrevVolume(volume);
                    setVolume(0);
                    setIsMuted(true);
                  }
                }}
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span className="text-[11px]">Âm thanh gốc</span>
              </button>

              {/* Volume Slider */}
              <div className={`flex items-center transition-all duration-200 overflow-hidden ${showVolumeSlider ? 'w-20 opacity-100' : 'w-0 opacity-0'}`}>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const newVol = Number(e.target.value);
                    setVolume(newVol);
                    if (newVol === 0) {
                      setIsMuted(true);
                    } else {
                      setIsMuted(false);
                      setPrevVolume(newVol);
                    }
                  }}
                  className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-3
                    [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-primary"
                />
              </div>
            </div>

            <button
              onClick={togglePlayPause}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span className="text-[11px]">{isPaused ? 'Phát' : 'Tạm dừng'}</span>
            </button>

            <span className="text-white/50 text-[11px]">
              {currentReel.views_count.toLocaleString()} lượt xem
            </span>
          </div>
        </div>

        {/* Navigation Arrows (Desktop) */}
        <div className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 flex-col gap-3 z-20">
          <button
            onClick={() => handleScroll('up')}
            className="w-10 h-10 bg-bg-secondary/80 backdrop-blur-md rounded-[12px] flex items-center justify-center hover:bg-bg-secondary transition-all"
          >
            <ChevronUp className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => handleScroll('down')}
            className="w-10 h-10 bg-bg-secondary/80 backdrop-blur-md rounded-[12px] flex items-center justify-center hover:bg-bg-secondary transition-all"
          >
            <ChevronDown className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Swipe Hint (Mobile) */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 md:hidden z-20">
          <span className="text-white/30 text-[10px]">Vuốt lên/xuống để xem thêm</span>
        </div>
      </div>

      {/* Comments Panel */}
      <ReelCommentsPanel
        reelId={currentReel.id}
        isOpen={showCommentsPanel}
        onClose={() => setShowCommentsPanel(false)}
        onCommentCountUpdate={(count) => {
          setReels(prev => prev.map(r =>
            r.id === currentReel.id ? { ...r, comments_count: count } : r
          ));
        }}
      />
    </>
  );
};
