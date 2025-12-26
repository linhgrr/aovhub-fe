import React, { useState, useEffect } from 'react';
import { X, Plus, Play, Bookmark, Loader2, Eye } from 'lucide-react';
import { CreateReel } from './CreateReel';

interface ReelThumbnail {
    id: string;
    thumbnail_url: string;
    views_count: number;
    video_processed?: boolean;
}

interface MyReelsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onReelClick?: (reelId: string) => void;
}

export const MyReelsPanel: React.FC<MyReelsPanelProps> = ({ isOpen, onClose, onReelClick }) => {
    const [activeTab, setActiveTab] = useState<'my' | 'saved'>('my');
    const [myReels, setMyReels] = useState<ReelThumbnail[]>([]);
    const [savedReels, setSavedReels] = useState<ReelThumbnail[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

    useEffect(() => {
        if (isOpen) {
            loadMyReels();
            loadSavedReels();
        }
    }, [isOpen]);

    const loadMyReels = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('auth_token');

            const profileRes = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (profileRes.ok) {
                const profileData = await profileRes.json();
                const userId = profileData.user?.id || profileData.id;

                if (!userId) {
                    console.error('Could not get user ID from profile');
                    return;
                }

                const reelsRes = await fetch(`${API_URL}/reels/user/${userId}?limit=50`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (reelsRes.ok) {
                    const reelsData = await reelsRes.json();
                    setMyReels(reelsData.reels || []);
                }
            }
        } catch (err) {
            console.error('Failed to load my reels:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadSavedReels = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/reels/saved?limit=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setSavedReels(data.reels || []);
            }
        } catch (err) {
            console.error('Failed to load saved reels:', err);
        }
    };

    const formatViews = (count: number): string => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Create Reel Modal */}
            {showCreateModal && (
                <CreateReel
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        loadMyReels();
                        setShowCreateModal(false);
                    }}
                />
            )}

            {/* Panel Overlay */}
            <div className="fixed inset-0 z-[60] flex justify-end">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in"
                    onClick={onClose}
                />

                {/* Side Panel */}
                <div className="relative w-full md:max-w-[400px] bg-bg-secondary h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-bg-main border-b border-white/5 flex-shrink-0">
                        <h2 className="font-montserrat font-bold text-white text-[15px]">Reels của tôi</h2>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-bg-secondary hover:bg-bg-secondary/70 transition-colors"
                        >
                            <X className="w-4 h-4 text-[#7f7f7f]" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-white/5 bg-bg-main">
                        <button
                            onClick={() => setActiveTab('my')}
                            className={`flex-1 py-3.5 flex items-center justify-center gap-2 text-[12px] font-medium transition-all ${activeTab === 'my'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-[#7f7f7f] hover:text-white'
                                }`}
                        >
                            <Play className="w-4 h-4" />
                            <span>Reels của tôi</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('saved')}
                            className={`flex-1 py-3.5 flex items-center justify-center gap-2 text-[12px] font-medium transition-all ${activeTab === 'saved'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-[#7f7f7f] hover:text-white'
                                }`}
                        >
                            <Bookmark className="w-4 h-4" />
                            <span>Đã lưu</span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto bg-bg-main custom-scrollbar">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                        ) : activeTab === 'my' ? (
                            <div className="grid grid-cols-3 gap-0.5 p-0.5">
                                {/* Upload Card */}
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="aspect-[9/16] bg-gradient-to-br from-primary/80 via-primary to-amber-500 flex flex-col items-center justify-center gap-2 hover:opacity-90 transition-opacity rounded-[4px] overflow-hidden"
                                >
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-[12px] flex items-center justify-center">
                                        <Plus className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-white font-semibold text-[10px] text-center px-2">Tạo Reel</span>
                                </button>

                                {/* User's Reels */}
                                {myReels.map((reel) => (
                                    <button
                                        key={reel.id}
                                        onClick={() => onReelClick?.(reel.id)}
                                        className="aspect-[9/16] bg-bg-secondary relative overflow-hidden group rounded-[4px]"
                                    >
                                        {reel.thumbnail_url ? (
                                            <img
                                                src={reel.thumbnail_url}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                                <Play className="w-8 h-8 text-primary/40" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Processing Badge
                                        {!reel.video_processed && (
                                            <div className="absolute top-1.5 right-1.5 bg-amber-500/90 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-[4px]">
                                                Đang xử lý
                                            </div>
                                        )} */}

                                        {/* Views Count */}
                                        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-white text-[9px]">
                                            <Eye className="w-3 h-3" />
                                            <span className="font-medium">{formatViews(reel.views_count)}</span>
                                        </div>

                                        {/* Play Button Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                <Play className="w-5 h-5 text-white ml-0.5" />
                                            </div>
                                        </div>
                                    </button>
                                ))}

                                {/* Empty State */}
                                {myReels.length === 0 && (
                                    <div className="col-span-2 flex flex-col items-center justify-center py-12 text-[#7f7f7f]">
                                        <Play className="w-10 h-10 mb-2 opacity-40" />
                                        <p className="text-[12px]">Chưa có reel nào</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-0.5 p-0.5">
                                {savedReels.length === 0 ? (
                                    <div className="col-span-3 flex flex-col items-center justify-center py-16 text-[#7f7f7f]">
                                        <Bookmark className="w-12 h-12 mb-3 opacity-30" />
                                        <p className="text-[12px]">Chưa có reel đã lưu</p>
                                    </div>
                                ) : (
                                    savedReels.map((reel) => (
                                        <button
                                            key={reel.id}
                                            onClick={() => onReelClick?.(reel.id)}
                                            className="aspect-[9/16] bg-bg-secondary relative overflow-hidden group rounded-[4px]"
                                        >
                                            {reel.thumbnail_url ? (
                                                <img
                                                    src={reel.thumbnail_url}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                                    <Play className="w-8 h-8 text-primary/40" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                    <Play className="w-5 h-5 text-white ml-0.5" />
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
